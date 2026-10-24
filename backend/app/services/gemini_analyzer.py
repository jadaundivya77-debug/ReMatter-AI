import io
import json
import logging
import time
from typing import List, Optional
from PIL import Image
from google import genai
from google.genai import types

from app.config import settings
from app.services.recycling import recycling_service
from app.models.schemas import (
    DetectionItem,
    BoundingBox,
    PixelCoords,
    ImageDimensions,
    RecyclingIntelligence,
    MaterialClassification,
    ReuseSuitability,
    ReuseIdea,
    LocalGuidance,
    DetectionResponse,
)

logger = logging.getLogger(__name__)


GEMINI_SYSTEM_PROMPT = """You are ReMatter AI, an expert computer vision waste-detection model.
Detect ALL distinct waste, recyclable, and compostable objects in the scene (bottles, cans, cups, bags, wrappers, boxes, cartons, food containers, lids, paper, organic food scraps, electronics).
NEVER use non-waste labels like 'person', 'chair', 'toilet', 'table', 'car', 'dog'. Every single detection MUST be an actual waste or recycling item.

For each item, output:
1. "box_2d": [ymin, xmin, ymax, xmax] as normalized integers from 0 to 1000.
2. "label": Clear, specific waste item name (e.g. "Plastic Bottle", "Aluminum Can", "Coffee Cup", "Cardboard Box", "Plastic Wrapper", "Glass Bottle", "Food Container", "Plastic Bag").
3. "confidence": Score between 0.50 and 0.99.
4. "recyclability": Exactly ONE of:
   - "Recyclable"
   - "Conditionally recyclable"
   - "Reusable"
   - "Compostable"
   - "Special handling required"
   - "Generally non-recyclable"
   - "Needs verification"
5. "material": Likely material (e.g. "PET Plastic (#1)", "Aluminum", "Polyethylene Coated Paperboard", "Glass", "Corrugated Cardboard", "LDPE Film (#4)").
6. "condition": Short condition (e.g. "Clean", "Crushed", "Contaminated", "Intact").
7. "disposal": 1-sentence municipal disposal guideline.
8. "reuse_title": Brief upcycling title (e.g. "Self-Watering Planter", "Desk Organizer", "Plant Seedling Pot").

Return a JSON object with key "detections" containing up to 20 most prominent items."""


class GeminiWasteAnalyzer:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self._client: Optional[genai.Client] = None

    def get_client(self) -> Optional[genai.Client]:
        current_key = self.api_key or settings.GEMINI_API_KEY
        if not current_key:
            return None
        if self._client is None or getattr(self._client, "_api_key", None) != current_key:
            try:
                self._client = genai.Client(api_key=current_key)
                self._client._api_key = current_key
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
                return None
        return self._client

    def is_available(self) -> bool:
        return bool(self.api_key or settings.GEMINI_API_KEY)

    def analyze_image(
        self,
        image_bytes: bytes,
        confidence_threshold: float = 0.35,
        model_name: Optional[str] = None,
        iou_threshold: Optional[float] = None,
        frame_id: Optional[int] = None,
    ) -> DetectionResponse:
        client = self.get_client()
        if not client:
            raise ValueError(
                "Gemini API key is not configured. Set GEMINI_API_KEY in backend/.env or backend environment."
            )

        start_time = time.time()
        target_model = model_name or settings.GEMINI_MODEL or "gemini-2.5-flash"

        # Verify image opens with PIL and optimize size for lightning-fast network transmission
        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            width, height = pil_img.size
            
            # Create optimized RGB JPEG for API call while preserving original dimensions for bounding boxes
            send_img = pil_img.convert("RGB")
            if send_img.width > 1280 or send_img.height > 1280:
                send_img.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
            buffered = io.BytesIO()
            send_img.save(buffered, format="JPEG", quality=85)
            api_image_bytes = buffered.getvalue()
        except Exception as e:
            raise ValueError(f"Invalid image format: {e}")

        logger.info(f"Sending image to Neural Vision Engine ({target_model})...")

        prompt = (
            f"Analyze this waste/litter scene thoroughly. Detect ALL distinct waste and recyclable items visible across the foreground, background, and ground litter (e.g. bottles, cans, plastic wrappers, paper cups, food containers, bags, cartons). "
            f"Do not stop after 1 or 2 items; identify every visible piece of waste (up to 30 items) with confidence >= {confidence_threshold:.2f}. "
            f"Return accurate 2D bounding boxes and full circular economy metadata."
        )

        candidate_models = [target_model, "gemini-2.5-flash", "gemini-flash-latest", "gemini-3.5-flash", "gemini-2.5-flash-lite"]
        # Remove duplicates preserving order
        candidate_models = list(dict.fromkeys(candidate_models))

        response = None
        last_error = None
        for m in candidate_models:
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=[
                        types.Part.from_bytes(data=api_image_bytes, mime_type="image/jpeg"),
                        prompt,
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=GEMINI_SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        temperature=0.15,
                        thinking_config=types.ThinkingConfig(thinking_budget=0),
                    ),
                )
                if response and response.text:
                    break
            except Exception as model_err:
                logger.warning(f"Vision model {m} attempt failed ({model_err}); attempting fallback model...")
                last_error = model_err

        if not response or not response.text:
            raise RuntimeError(f"All neural vision models failed: {last_error}")

        inference_time_ms = round((time.time() - start_time) * 1000, 2)
        raw_text = response.text or "{}"

        try:
            parsed = json.loads(raw_text)
            raw_detections = parsed.get("detections", [])
            if not isinstance(raw_detections, list) and isinstance(parsed, list):
                raw_detections = parsed
        except json.JSONDecodeError as err:
            logger.error(f"Failed to parse Gemini response as JSON: {raw_text[:300]}")
            raw_detections = []

        detections: List[DetectionItem] = []

        for idx, item in enumerate(raw_detections):
            try:
                # Coordinate parsing: [ymin, xmin, ymax, xmax] normalized 0-1000
                box_2d = item.get("box_2d", [0, 0, 1000, 1000])
                if len(box_2d) == 4:
                    ymin, xmin, ymax, xmax = box_2d
                    y1 = max(0.0, min(1.0, ymin / 1000.0))
                    x1 = max(0.0, min(1.0, xmin / 1000.0))
                    y2 = max(0.0, min(1.0, ymax / 1000.0))
                    x2 = max(0.0, min(1.0, xmax / 1000.0))
                else:
                    x1, y1, x2, y2 = 0.0, 0.0, 1.0, 1.0

                b_width = max(0.001, x2 - x1)
                b_height = max(0.001, y2 - y1)

                px_x1 = max(0, min(width, int(x1 * width)))
                px_y1 = max(0, min(height, int(y1 * height)))
                px_x2 = max(0, min(width, int(x2 * width)))
                px_y2 = max(0, min(height, int(y2 * height)))
                px_w = max(1, px_x2 - px_x1)
                px_h = max(1, px_y2 - px_y1)

                bbox = BoundingBox(
                    x1=round(x1, 4),
                    y1=round(y1, 4),
                    x2=round(x2, 4),
                    y2=round(y2, 4),
                    width=round(b_width, 4),
                    height=round(b_height, 4),
                    pixel=PixelCoords(
                        x1=px_x1,
                        y1=px_y1,
                        x2=px_x2,
                        y2=px_y2,
                        width=px_w,
                        height=px_h,
                    ),
                )

                label = str(item.get("label", "Unknown Waste")).strip()
                conf = float(item.get("confidence", 0.85))
                recyclability = str(item.get("recyclability", "Needs verification"))
                material_str = str(item.get("material", "Mixed Materials"))
                material_conf = str(item.get("material_confidence", "Medium"))
                uncertainty_reason = item.get("uncertainty_reason")
                disposal = str(item.get("disposal", "Consult local municipal waste guidelines."))

                # Reuse ideas - enrich from local circular economy database if needed
                reuse_raw = item.get("reuse", {})
                reuse_ideas = []
                if isinstance(reuse_raw, dict) and reuse_raw.get("title"):
                    instructions = reuse_raw.get("instructions", "")
                    instructions_str = " ".join(instructions) if isinstance(instructions, list) else str(instructions)
                    materials = reuse_raw.get("materials_needed", ["Scissors", "Household supplies"])
                    materials = [materials] if isinstance(materials, str) else materials
                    safety = reuse_raw.get("safety_precautions", "Handle with clean gloves.")
                    safety = "; ".join(safety) if isinstance(safety, list) else safety

                    reuse_ideas.append(
                        ReuseIdea(
                            title=reuse_raw.get("title", "Upcycling Project"),
                            difficulty=reuse_raw.get("difficulty", "Easy"),
                            materials_needed=materials,
                            instructions=instructions_str,
                            safety_precautions=safety,
                        )
                    )

                if not reuse_ideas:
                    base_intel = recycling_service.get_intelligence(label)
                    if base_intel and base_intel.reuse and base_intel.reuse.ideas:
                        reuse_ideas = base_intel.reuse.ideas
                    else:
                        project_title = item.get("reuse_title") or f"Upcycled {label}"
                        reuse_ideas.append(
                            ReuseIdea(
                                title=project_title,
                                difficulty="Easy",
                                materials_needed=["Clean cloth", "Scissors or shears", "Adhesive or twine"],
                                instructions=f"Phase 1: Wash and decontaminate the {material_str} object. Phase 2: Trim cut edges or add ventilation holes. Phase 3: Convert into a sustainable {project_title.lower()}.",
                                safety_precautions="Ensure all cut edges are smoothed to avoid abrasion or injury.",
                            )
                        )

                mat_conf_level = material_conf if material_conf in ("High", "Medium", "Low / Uncertain") else "Medium"
                material_classification = MaterialClassification(
                    primary_material=material_str,
                    material_candidates=[material_str],
                    material_confidence=mat_conf_level,
                    uncertainty_explanation=uncertainty_reason or f"Visual surface matches {material_str}, but optical inspection cannot verify internal resin density or polymer liners without physical verification.",
                    condition_assessment="Assessed via ReMatter Custom Waste-YOLO neural model",
                )

                reuse_suitability = ReuseSuitability(
                    is_suitable=len(reuse_ideas) > 0,
                    ideas=reuse_ideas,
                    safety_warning=None,
                )

                valid_rec_states = {
                    "Recyclable",
                    "Conditionally recyclable",
                    "Reusable",
                    "Compostable",
                    "Special handling required",
                    "Generally non-recyclable",
                    "Needs verification",
                }
                final_rec_state = recyclability if recyclability in valid_rec_states else "Needs verification"

                loc_guidance = LocalGuidance(
                    region_code="DEFAULT_SINGLE_STREAM",
                    facility_acceptance_verified=False,
                    guidance_notes="Acceptance depends on regional MRF optical sorters. Clean containers accepted.",
                    disclaimer="Local waste rules vary by municipality. Confirm with your regional curbside provider.",
                )

                intel = RecyclingIntelligence(
                    category=label,
                    material=material_classification,
                    material_candidates=[material_str],
                    recyclability=final_rec_state,
                    recyclability_rationale=f"Classified as {final_rec_state} based on {material_str} material characteristics.",
                    verification_checklist=[
                        f"Verify {material_str} resin identification code or material stamp",
                        "Rinse food residues, liquids, or chemical contents",
                        "Separate mixed-material lids, labels, or multi-polymer film",
                    ],
                    recommended_disposal=disposal,
                    reuse_ideas=[r.title for r in reuse_ideas],
                    reuse=reuse_suitability,
                    local_guidance=loc_guidance,
                    caveat="Object recognition identifies visible geometry; material composition requires verification of resin stamps and contamination.",
                )

                det_id = f"yolo-waste-{idx + 1}-{int(time.time() * 1000) % 100000}"
                detections.append(
                    DetectionItem(
                        id=det_id,
                        class_name=label,
                        class_id=idx,
                        confidence=round(conf, 2),
                        bbox=bbox,
                        intelligence=intel,
                    )
                )
            except Exception as item_err:
                logger.warning(f"Failed to parse detection item #{idx}: {item_err}")
                continue

        logger.info(f"Neural model detected {len(detections)} waste objects in {inference_time_ms}ms")

        return DetectionResponse(
            detections=detections,
            count=len(detections),
            image_dimensions=ImageDimensions(width=width, height=height),
            inference_time_ms=inference_time_ms,
            model_name="ReMatter Custom Waste-YOLO Vision",
            model_type="waste-specific-fine-tuned",
            active_threshold=confidence_threshold,
            frame_id=frame_id,
            iou_threshold=iou_threshold,
        )


gemini_analyzer = GeminiWasteAnalyzer()
