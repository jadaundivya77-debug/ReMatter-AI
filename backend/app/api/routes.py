import io
import os
import base64
import logging
import asyncio
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from pydantic import BaseModel, Field
from PIL import Image, UnidentifiedImageError

from ..config import settings
from ..models.schemas import (
    DetectionResponse,
    HealthResponse,
    SupportedCategory,
    RecyclingIntelligence,
    ReuseSuitability,
    ModelMetadataResponse,
    MaterialEvaluationRequest,
    MaterialEvaluationResponse,
)
from ..services.detector import get_detector
from ..services.recycling import recycling_service
from ..services.material_classifier import material_classifier
from ..services.gemini_analyzer import gemini_analyzer
from ..services.analytics import analytics_service
from fastapi.responses import PlainTextResponse

logger = logging.getLogger("rematter.api")

router = APIRouter()

# Concurrency limiter to prevent unbounded simultaneous model inferences
inference_semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_INFERENCES)


class Base64FramePayload(BaseModel):
    image: str = Field(..., description="Base64 encoded JPEG/PNG frame, with or without data:image prefix")
    confidence: Optional[float] = Field(None, ge=0.05, le=0.95, description="Confidence threshold between 0.05 and 0.95")
    iou_threshold: Optional[float] = Field(None, ge=0.1, le=0.9, description="Optional NMS IoU overlap threshold")
    frame_id: Optional[int] = Field(None, description="Monotonically increasing client frame sequence ID for ordering")


def _read_image_from_bytes(data: bytes) -> Image.Image:
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Image byte payload is empty.")

    if len(data) > settings.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image size ({len(data)} bytes) exceeds maximum {settings.MAX_IMAGE_SIZE_BYTES} bytes limit."
        )

    try:
        image = Image.open(io.BytesIO(data))
        # Force loading image data to verify against truncated or corrupt streams
        image.load()
        # Ensure image is in RGB format (handles PNG RGBA or palette modes)
        if image.mode != "RGB":
            image = image.convert("RGB")
        return image
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file could not be decoded as a valid image (JPEG, PNG, WebP supported)."
        )
    except Exception as e:
        logger.warning(f"Corrupt or invalid image format: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Image decoding failed: {str(e)}"
        )


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Returns backend service and active model readiness status."""
    try:
        det = get_detector()
        return HealthResponse(
            status="healthy",
            app_name=settings.APP_NAME,
            version=settings.APP_VERSION,
            model_loaded=det.model_loaded,
            model_name=os.path.basename(det.model_path),
            device=det.device,
            supported_classes_count=len(det.class_names)
        )
    except Exception as e:
        logger.error(f"Health check failure: {e}")
        return HealthResponse(
            status="degraded",
            app_name=settings.APP_NAME,
            version=settings.APP_VERSION,
            model_loaded=False,
            model_name=settings.REMATTER_MODEL,
            device="unknown",
            supported_classes_count=0
        )


@router.get("/model/metadata", response_model=ModelMetadataResponse)
async def get_model_metadata():
    """
    Returns active computer vision model architecture details, device placement,
    NMS hyperparameters, class taxonomy, and waste stream mappings.
    """
    det = get_detector()
    return det.get_metadata()


@router.post("/detect", response_model=DetectionResponse)
async def detect_from_file(
    file: UploadFile = File(...),
    confidence: Optional[float] = Form(None),
    iou_threshold: Optional[float] = Form(None),
):
    """
    Analyzes an uploaded image file (multipart/form-data).
    Offloaded to a worker thread pool and bounded by concurrency semaphore.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Please upload an image file."
        )

    contents = await file.read()
    pil_image = _read_image_from_bytes(contents)

    # Prioritize Neural Vision for uploaded images when available
    if gemini_analyzer.is_available() and settings.VISION_ENGINE in ("gemini", "auto"):
        try:
            logger.info("Routing upload analysis to Neural Vision Engine...")
            response = await asyncio.to_thread(
                gemini_analyzer.analyze_image,
                contents,
                confidence_threshold=confidence or settings.DEFAULT_CONFIDENCE,
                iou_threshold=iou_threshold or settings.NMS_IOU_THRESHOLD,
            )
            if response.count > 0 or settings.VISION_ENGINE == "gemini":
                return response
        except Exception as gemini_err:
            logger.warning(f"Neural Vision call failed ({gemini_err}), falling back to local YOLO: {gemini_err}")

    det = get_detector()

    # Bounded concurrency: prevents server exhaustion during burst requests
    async with inference_semaphore:
        try:
            # Offload heavy PyTorch inference to a worker thread so the async event loop stays non-blocking
            response = await asyncio.to_thread(
                det.detect,
                pil_image,
                confidence_threshold=confidence,
                iou_threshold=iou_threshold,
            )
            return response
        except Exception as e:
            logger.error(f"Inference error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Inference pipeline error: {str(e)}")


@router.post("/detect/frame", response_model=DetectionResponse)
async def detect_from_frame(payload: Base64FramePayload):
    """
    Analyzes a base64 encoded video frame.
    Non-blocking execution with client sequence frame_id tracking and NMS overlap support.
    Uses ultra-fast local YOLO for real-time live camera streaming (70ms),
    with optional deep neural scan on demand.
    """
    raw_str = payload.image
    if "," in raw_str:
        # Strip data:image/...;base64, header if present
        raw_str = raw_str.split(",", 1)[1]

    try:
        img_bytes = base64.b64decode(raw_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 encoding for video frame.")

    # Prioritize Neural Vision (Gemini) for live video frames when available
    if gemini_analyzer.is_available() and settings.VISION_ENGINE in ("gemini", "auto"):
        try:
            effective_iou = payload.iou_threshold if payload.iou_threshold is not None else settings.NMS_IOU_THRESHOLD
            response = await asyncio.to_thread(
                gemini_analyzer.analyze_image,
                img_bytes,
                confidence_threshold=payload.confidence or settings.DEFAULT_CONFIDENCE,
                iou_threshold=effective_iou,
                frame_id=payload.frame_id,
            )
            response.frame_id = payload.frame_id
            response.iou_threshold = effective_iou
            return response
        except Exception as gemini_err:
            logger.warning(f"Frame analysis with Neural Vision failed ({gemini_err}), falling back to YOLO: {gemini_err}")

    pil_image = _read_image_from_bytes(img_bytes)
    det = get_detector()

    # Bounded concurrency: prevents thread starvation
    async with inference_semaphore:
        try:
            # Offload heavy PyTorch inference to a worker thread
            response = await asyncio.to_thread(
                det.detect,
                pil_image,
                confidence_threshold=payload.confidence,
                iou_threshold=payload.iou_threshold,
                frame_id=payload.frame_id,
            )
            return response
        except Exception as e:
            logger.error(f"Frame inference error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Frame inference error: {str(e)}")


@router.post("/material/evaluate", response_model=MaterialEvaluationResponse)
async def evaluate_material_stage(payload: MaterialEvaluationRequest):
    """
    Dedicated material classification stage independent of object detection.
    Evaluates physical composition probability, uncertainty metrics, and optical limits.
    """
    crop_image = None
    if payload.image_crop_base64:
        raw_crop = payload.image_crop_base64
        if "," in raw_crop:
            raw_crop = raw_crop.split(",", 1)[1]
        try:
            crop_bytes = base64.b64decode(raw_crop)
            crop_image = _read_image_from_bytes(crop_bytes)
        except Exception as e:
            logger.warning(f"Could not parse image crop: {e}")

    return material_classifier.evaluate_material(
        payload.object_label,
        image_crop=crop_image,
        context_notes=payload.context_notes,
    )


@router.get("/categories", response_model=List[SupportedCategory])
async def get_supported_categories():
    """Lists the 8 canonical waste categories and handling guidance."""
    return recycling_service.get_supported_categories()


@router.get("/intelligence/{class_name}", response_model=RecyclingIntelligence)
async def get_item_intelligence(
    class_name: str,
    region: Optional[str] = Query(None, description="Optional region/postal code for localized recycling guidance")
):
    """
    Returns full recycling intelligence for a specific detected object class,
    including independent material classification, recyclability state,
    disposal recommendation, structured reuse projects, and local guidance.
    """
    return recycling_service.get_intelligence(class_name, region_override=region)


@router.get("/reuse/{class_name}", response_model=ReuseSuitability)
async def get_item_reuse_guidance(class_name: str):
    """
    Returns dedicated structured reuse projects, difficulty levels,
    required materials, step-by-step instructions, and safety warnings.
    """
    return recycling_service.get_reuse_guidance(class_name)


class GeminiKeyPayload(BaseModel):
    api_key: str = Field(..., min_length=10, description="Google Gemini API key")


@router.post("/config/gemini-key")
async def set_gemini_api_key(payload: GeminiKeyPayload):
    """
    Dynamically sets or validates the Gemini API key, persisting it to .env
    and enabling high-accuracy Gemini 2.5 Flash Vision for multi-object waste analysis.
    """
    key = payload.api_key.strip()
    try:
        from google import genai
        test_client = genai.Client(api_key=key)
        # Fast validation call
        test_client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Confirm",
        )
    except Exception as e:
        logger.error(f"Failed to validate Neural Engine key: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Neural Engine key validation failed: {str(e)}"
        )

    settings.GEMINI_API_KEY = key
    gemini_analyzer.api_key = key
    settings.VISION_ENGINE = "gemini"

    # Persist to backend/.env
    backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    try:
        lines = []
        if os.path.exists(backend_env):
            with open(backend_env, "r") as f:
                lines = f.readlines()
        
        updated = False
        new_lines = []
        for line in lines:
            if line.startswith("GEMINI_API_KEY="):
                new_lines.append(f"GEMINI_API_KEY={key}\n")
                updated = True
            elif line.startswith("VISION_ENGINE="):
                new_lines.append("VISION_ENGINE=gemini\n")
            else:
                new_lines.append(line)
        
        if not updated:
            new_lines.append(f"\nGEMINI_API_KEY={key}\nVISION_ENGINE=gemini\n")

        with open(backend_env, "w") as f:
            f.writelines(new_lines)
    except Exception as env_err:
        logger.warning(f"Could not persist GEMINI_API_KEY to .env: {env_err}")

    return {
        "status": "connected",
        "engine": "neural_core",
        "model": "ReMatter Waste-YOLO Vision",
        "message": "ReMatter Waste-YOLO Neural Vision Core successfully connected and activated."
    }


@router.get("/config/engine")
async def get_engine_status():
    """Returns active vision engine and availability."""
    has_neural = gemini_analyzer.is_available()
    active = "neural_core" if has_neural and settings.VISION_ENGINE in ("gemini", "auto") else "yolo"
    return {
        "active_engine": active,
        "neural_core_available": has_neural,
        "neural_model": "ReMatter Waste-YOLO Vision",
        "yolo_model": os.path.basename(settings.REMATTER_MODEL),
    }


# =========================================================================
# C6. WasteWise Analytics — Municipal Waste Generation & Operations Endpoints
# =========================================================================

@router.get("/analytics/metrics", tags=["WasteWise Analytics"])
async def get_analytics_metrics(
    ward: Optional[str] = Query(None, description="Filter by ward name or 'ALL'"),
    time_grain: str = Query("monthly", pattern="^(daily|weekly|monthly)$"),
    unit: str = Query("tonnes", pattern="^(tonnes|kg)$"),
):
    """Calculates summary KPIs, Collection Reliability Index, and time-series aggregations."""
    return analytics_service.get_kpis_and_time_series(ward_filter=ward, time_grain=time_grain, unit=unit)


@router.get("/analytics/neighbourhoods", tags=["WasteWise Analytics"])
async def get_neighbourhood_comparisons(unit: str = Query("tonnes", pattern="^(tonnes|kg)$")):
    """Returns normalized per-capita and per-household comparisons across municipal wards."""
    return analytics_service.get_neighbourhood_comparison(unit=unit)


@router.get("/analytics/missed-collections", tags=["WasteWise Analytics"])
async def get_missed_collections():
    """Returns operational incident log of missed and delayed collection routes."""
    return analytics_service.get_missed_collections_log()


@router.get("/analytics/intervention", tags=["WasteWise Analytics"])
async def get_intervention_comparison():
    """Compares waste quantities and diversion rates before vs after documented municipal interventions."""
    return analytics_service.get_intervention_analysis()


@router.get("/analytics/report", tags=["WasteWise Analytics"])
async def get_executive_report():
    """Compiles an automated executive operational review report with actionable recommendations."""
    return analytics_service.generate_executive_report()


@router.get("/analytics/dataset/download-csv", tags=["WasteWise Analytics"])
async def download_synthetic_dataset_csv():
    """Provides raw CSV download of the multi-month, multi-ward municipal collection records."""
    csv_text = analytics_service.get_preloaded_csv()
    return PlainTextResponse(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=wastewise_municipal_collection_records.csv"}
    )


@router.post("/analytics/upload-csv", tags=["WasteWise Analytics"])
async def upload_custom_csv(file: UploadFile = File(...)):
    """Ingests and validates a custom user-provided municipal collection records CSV."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")
    contents = await file.read()
    result = analytics_service.load_user_csv(contents)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "CSV parsing failed."))
    return result


@router.post("/analytics/dataset/reset", tags=["WasteWise Analytics"])
async def reset_synthetic_dataset():
    """Resets active data back to the 6-month, 5-ward benchmark synthetic dataset."""
    analytics_service.reset_to_synthetic()
    return {"status": "success", "message": "Dataset reset to 6-month synthetic municipal benchmark."}

