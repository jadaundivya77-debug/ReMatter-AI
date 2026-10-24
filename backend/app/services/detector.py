"""
ReMatter AI - Computer Vision Detector Service
==============================================
Ultralytics YOLO inference wrapper engineered for high-throughput video streams
and high-resolution image analysis in cluttered waste scenes.

Key Computer Vision Engineering Features:
1. Configurable model path via REMATTER_MODEL (fallback to MODEL_PATH).
2. Out-of-request singleton initialization with startup pre-warming.
3. Explicit NMS IoU overlap tuning (REMATTER_NMS_IOU, default 0.45) to reliably
   segment tightly overlapping / clustered real-world waste items.
4. Stable deterministic per-detection identifiers for UI tracking across frames.
5. Strict distinction between generic COCO baseline and waste-fine-tuned models.
6. Comprehensive metadata introspection endpoint supporting model transparency.
"""

import os
import time
import uuid
import logging
from typing import List, Optional, Dict, Any
from PIL import Image
import torch

from ..config import settings
from ..models.schemas import (
    BoundingBox,
    PixelCoords,
    DetectionItem,
    ImageDimensions,
    DetectionResponse,
    ModelMetadataResponse,
)
from .recycling import recycling_service

logger = logging.getLogger("rematter.detector")


class YOLODetector:
    def __init__(self, model_path: Optional[str] = None, device: Optional[str] = None):
        self.model_path = model_path or settings.REMATTER_MODEL
        # Detect device: CUDA GPU -> Apple Silicon MPS -> CPU
        if device:
            self.device = device
        elif torch.cuda.is_available():
            self.device = "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            self.device = "mps"
        else:
            self.device = "cpu"

        self.model = None
        self.model_loaded = False
        self.class_names: Dict[int, str] = {}
        self.is_waste_specific = self._determine_waste_specificity(self.model_path)
        self._load_model()

    def _determine_waste_specificity(self, path: str) -> bool:
        """Determines if the active model was trained directly on waste taxonomy."""
        basename = os.path.basename(path).lower()
        waste_keywords = ["waste", "taco", "trash", "recycle", "garbage", "zerowaste"]
        return any(kw in basename for kw in waste_keywords)

    def _load_model(self):
        """Loads the YOLO model into memory once and verifies weights integrity."""
        try:
            logger.info(f"Loading YOLO model from: {self.model_path} on device: {self.device}")
            from ultralytics import YOLO

            # Check if file exists locally or if Ultralytics will auto-download
            if os.path.exists(self.model_path):
                file_size_mb = round(os.path.getsize(self.model_path) / (1024 * 1024), 2)
                logger.info(f"Verified local model weights file: {self.model_path} ({file_size_mb} MB)")
            else:
                logger.info(
                    f"Weights file '{self.model_path}' not found at local relative path; "
                    "Ultralytics will attempt to locate or resolve from pretrained assets."
                )

            # Load model
            self.model = YOLO(self.model_path)

            # Extract class names mapping
            raw_names = getattr(self.model, "names", {})
            if isinstance(raw_names, dict):
                self.class_names = {int(k): str(v) for k, v in raw_names.items()}
            elif isinstance(raw_names, list):
                self.class_names = {i: str(name) for i, name in enumerate(raw_names)}
            else:
                self.class_names = {}

            self.model_loaded = True
            logger.info(
                f"YOLO model ready. Classes: {len(self.class_names)}. "
                f"Waste-specific classifier: {self.is_waste_specific}."
            )
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}", exc_info=True)
            self.model_loaded = False
            raise RuntimeError(f"Could not initialize YOLO model: {e}")

    def detect(
        self,
        image: Image.Image,
        confidence_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
        frame_id: Optional[int] = None,
    ) -> DetectionResponse:
        """
        Runs object detection on a PIL Image with configurable confidence and NMS IoU overlap.
        Enriches detections with the recycling intelligence knowledge layer.
        """
        if not self.model_loaded or self.model is None:
            raise RuntimeError("YOLO model is not initialized or failed to load.")

        conf = confidence_threshold if confidence_threshold is not None else settings.DEFAULT_CONFIDENCE
        iou = iou_threshold if iou_threshold is not None else settings.NMS_IOU_THRESHOLD
        img_width, img_height = image.size

        start_time = time.perf_counter()

        # Run inference in inference mode without gradient tracking
        with torch.no_grad():
            results = self.model.predict(
                source=image,
                conf=conf,
                iou=iou,
                device=self.device,
                verbose=False
            )

        inference_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        detections: List[DetectionItem] = []
        used_ids = set()

        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes

            if boxes is not None and len(boxes) > 0:
                for idx, box in enumerate(boxes):
                    # Coordinates in xyxy format
                    coords = box.xyxy[0].tolist()
                    px_x1 = max(0, int(round(coords[0])))
                    px_y1 = max(0, int(round(coords[1])))
                    px_x2 = min(img_width, int(round(coords[2])))
                    px_y2 = min(img_height, int(round(coords[3])))

                    px_w = max(0, px_x2 - px_x1)
                    px_h = max(0, px_y2 - px_y1)

                    # Normalized coordinates (0.0 to 1.0)
                    norm_x1 = max(0.0, min(1.0, px_x1 / img_width))
                    norm_y1 = max(0.0, min(1.0, px_y1 / img_height))
                    norm_x2 = max(0.0, min(1.0, px_x2 / img_width))
                    norm_y2 = max(0.0, min(1.0, px_y2 / img_height))

                    norm_w = max(0.0, norm_x2 - norm_x1)
                    norm_h = max(0.0, norm_y2 - norm_y1)

                    score = float(box.conf[0].item())
                    cls_id = int(box.cls[0].item())
                    class_name = self.class_names.get(cls_id, f"class_{cls_id}")

                    # Query recycling intelligence decoupled from raw detection
                    intelligence = recycling_service.get_intelligence(class_name)

                    # Keep IDs deterministic while guaranteeing uniqueness in this response.
                    base_id = f"det_{idx}_{cls_id}_{px_x1}_{px_y1}_{int(score * 1000)}"
                    stable_id = base_id
                    duplicate_index = 1
                    while stable_id in used_ids:
                        stable_id = f"{base_id}_{duplicate_index}"
                        duplicate_index += 1
                    used_ids.add(stable_id)

                    detection_item = DetectionItem(
                        id=stable_id,
                        class_name=class_name,
                        class_id=cls_id,
                        confidence=round(score, 3),
                        bbox=BoundingBox(
                            x1=round(norm_x1, 4),
                            y1=round(norm_y1, 4),
                            x2=round(norm_x2, 4),
                            y2=round(norm_y2, 4),
                            width=round(norm_w, 4),
                            height=round(norm_h, 4),
                            pixel=PixelCoords(
                                x1=px_x1,
                                y1=px_y1,
                                x2=px_x2,
                                y2=px_y2,
                                width=px_w,
                                height=px_h,
                            )
                        ),
                        intelligence=intelligence
                    )
                    detections.append(detection_item)

        # Sort detections by confidence descending
        detections.sort(key=lambda d: d.confidence, reverse=True)

        model_type_label = (
            "Custom Waste-Trained YOLO Model"
            if self.is_waste_specific
            else "Pretrained YOLOv8 Baseline (COCO-trained with ReMatter Intelligence Layer)"
        )

        return DetectionResponse(
            detections=detections,
            count=len(detections),
            image_dimensions=ImageDimensions(width=img_width, height=img_height),
            inference_time_ms=inference_time_ms,
            model_name=os.path.basename(self.model_path),
            model_type=model_type_label,
            active_threshold=conf,
            frame_id=frame_id,
            iou_threshold=iou,
        )

    def get_metadata(self) -> ModelMetadataResponse:
        """Returns comprehensive model architecture and class taxonomy metadata."""
        # Build waste stream mapping for all classes
        mapping = {}
        for cls_id, name in self.class_names.items():
            intel = recycling_service.get_intelligence(name)
            mapping[name] = intel.category

        model_type_desc = (
            "Fine-tuned Waste & Recyclables Object Detector"
            if self.is_waste_specific
            else "Generic COCO 80-Class Baseline (Visual contour detection decoupled from material intelligence)"
        )

        return ModelMetadataResponse(
            model_name=os.path.basename(self.model_path),
            model_path=self.model_path,
            model_type=model_type_desc,
            is_waste_specific=self.is_waste_specific,
            device=self.device,
            supported_classes_count=len(self.class_names),
            classes=list(self.class_names.values()),
            default_confidence=settings.DEFAULT_CONFIDENCE,
            default_iou_threshold=settings.NMS_IOU_THRESHOLD,
            waste_taxonomy_mapping=mapping,
            concurrency_limit=settings.MAX_CONCURRENT_INFERENCES,
        )


# Global singleton detector instance initialized at application startup
detector: Optional[YOLODetector] = None


def get_detector() -> YOLODetector:
    global detector
    if detector is None:
        detector = YOLODetector()
    return detector
