"""
Unit and Integration Tests for ReMatter AI Computer Vision Pipeline
====================================================================
Tests:
1. Valid image detection and response schema
2. Invalid image format handling (400 Bad Request)
3. Empty byte payload handling (400 Bad Request)
4. Oversized image file rejection (413 Payload Too Large)
5. Base64 corrupt and empty frame handling (400 Bad Request)
6. Out-of-order frame_id echoing and NMS IoU threshold pass-through
7. Model metadata introspection endpoint (/api/model/metadata)
8. Dedicated material classification stage (/api/material/evaluate)
9. Stable per-response detection IDs and bounding box normalization
"""

import io
import base64
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


def create_test_image_bytes(width: int = 320, height: int = 240, color=(120, 150, 180)) -> bytes:
    """Creates an in-memory valid JPEG image byte stream."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


class TestImageValidationAndErrors:
    def test_valid_image_detection(self):
        """Valid JPEG image upload returns 200 and conforms to DetectionResponse schema."""
        img_bytes = create_test_image_bytes()
        files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
        data = {"confidence": 0.25, "iou_threshold": 0.45}

        response = client.post("/api/detect", files=files, data=data)
        assert response.status_code == 200
        payload = response.json()

        assert "detections" in payload
        assert "count" in payload
        assert "image_dimensions" in payload
        assert payload["image_dimensions"]["width"] == 320
        assert payload["image_dimensions"]["height"] == 240
        assert "inference_time_ms" in payload
        assert payload["active_threshold"] == 0.25

    def test_invalid_mime_type_rejection(self):
        """Non-image MIME types are rejected with 400 Bad Request."""
        files = {"file": ("document.txt", b"Hello waste AI", "text/plain")}
        response = client.post("/api/detect", files=files)
        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]

    def test_empty_file_upload(self):
        """0-byte file upload returns 400 Bad Request."""
        files = {"file": ("empty.jpg", b"", "image/jpeg")}
        response = client.post("/api/detect", files=files)
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_corrupted_image_file_bytes(self):
        """Corrupted image bytes that fail Pillow decoding return 400 Bad Request."""
        corrupted_bytes = b"\xFF\xD8\xFF\xE0" + b"\x00" * 20  # Incomplete JPEG header
        files = {"file": ("corrupt.jpg", corrupted_bytes, "image/jpeg")}
        response = client.post("/api/detect", files=files)
        assert response.status_code == 400
        assert "could not be decoded" in response.json()["detail"].lower()

    def test_oversized_file_rejection(self):
        """Files exceeding MAX_IMAGE_SIZE_BYTES are rejected with 413 Payload Too Large."""
        # Temporarily set limit to 100 KB for test
        original_limit = settings.MAX_IMAGE_SIZE_BYTES
        try:
            settings.MAX_IMAGE_SIZE_BYTES = 50 * 1024  # 50 KB
            oversized_bytes = b"A" * (60 * 1024)
            files = {"file": ("large.jpg", oversized_bytes, "image/jpeg")}
            response = client.post("/api/detect", files=files)
            assert response.status_code == 413
            assert "exceeds maximum" in response.json()["detail"]
        finally:
            settings.MAX_IMAGE_SIZE_BYTES = original_limit


class TestLiveFrameInference:
    def test_valid_frame_with_sequence_id_and_nms(self):
        """Base64 video frame inference accepts frame_id and iou_threshold and echoes them."""
        img_bytes = create_test_image_bytes(200, 200)
        b64_str = base64.b64encode(img_bytes).decode("utf-8")

        payload = {
            "image": f"data:image/jpeg;base64,{b64_str}",
            "confidence": 0.30,
            "iou_threshold": 0.50,
            "frame_id": 142,
        }
        response = client.post("/api/detect/frame", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["frame_id"] == 142
        assert data["iou_threshold"] == 0.50
        assert data["active_threshold"] == 0.30

    def test_corrupt_base64_frame(self):
        """Invalid base64 payload returns 400 Bad Request."""
        payload = {
            "image": "not-valid-base64-content!@#$%",
            "confidence": 0.35,
        }
        response = client.post("/api/detect/frame", json=payload)
        assert response.status_code == 400
        assert "Invalid base64 encoding" in response.json()["detail"]

    def test_empty_base64_frame(self):
        """Empty decoded frame returns 400 Bad Request."""
        payload = {
            "image": "",
            "confidence": 0.35,
        }
        response = client.post("/api/detect/frame", json=payload)
        assert response.status_code == 400


class TestModelMetadataEndpoint:
    def test_model_metadata_introspection(self):
        """GET /api/model/metadata returns architecture, NMS settings, and class taxonomy."""
        response = client.get("/api/model/metadata")
        assert response.status_code == 200
        data = response.json()

        assert "model_name" in data
        assert "model_path" in data
        assert "model_type" in data
        assert "is_waste_specific" in data
        assert isinstance(data["is_waste_specific"], bool)
        assert data["supported_classes_count"] > 0
        assert len(data["classes"]) == data["supported_classes_count"]
        assert data["default_confidence"] == settings.DEFAULT_CONFIDENCE
        assert data["default_iou_threshold"] == settings.NMS_IOU_THRESHOLD
        assert "waste_taxonomy_mapping" in data
        assert len(data["waste_taxonomy_mapping"]) > 0

    def test_root_metadata_alias(self):
        """GET /model/metadata is also mounted at root level for discoverability."""
        response = client.get("/model/metadata")
        assert response.status_code == 200
        assert response.json()["supported_classes_count"] > 0


class TestDedicatedMaterialClassificationStage:
    def test_material_evaluation_endpoint(self):
        """POST /api/material/evaluate returns decoupled material confidence and uncertainty."""
        payload = {
            "object_label": "bottle",
            "context_notes": "takeout cold drink container"
        }
        response = client.post("/api/material/evaluate", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["object_label"] == "bottle"
        assert "PET" in data["likely_material"] or "HDPE" in data["likely_material"]
        assert len(data["material_candidates"]) >= 2
        # Material confidence score is distinct from YOLO bounding box confidence
        assert 0.0 <= data["material_confidence_score"] <= 1.0
        assert 0.0 <= data["uncertainty_score"] <= 1.0
        assert data["uncertainty_explanation"]
        assert data["optical_limits_note"]

    def test_material_evaluation_for_cup(self):
        """Cup material evaluation highlights polyethylene lining uncertainty."""
        payload = {"object_label": "cup"}
        response = client.post("/api/material/evaluate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["material_confidence"] in ["Medium", "Low / Uncertain"]
        assert "lining" in data["uncertainty_explanation"].lower() or "polyethylene" in data["uncertainty_explanation"].lower()


class TestBoundingBoxStructureAndStability:
    def test_detection_coordinate_normalization(self):
        """When detections are returned, bounding boxes are strictly normalized (0.0 to 1.0)."""
        img_bytes = create_test_image_bytes(640, 480)
        files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
        response = client.post("/api/detect", files=files, data={"confidence": 0.05})
        assert response.status_code == 200
        data = response.json()

        detection_ids = [det["id"] for det in data["detections"]]
        assert len(detection_ids) == len(set(detection_ids))

        for det in data["detections"]:
            bbox = det["bbox"]
            assert 0.0 <= bbox["x1"] <= 1.0
            assert 0.0 <= bbox["y1"] <= 1.0
            assert 0.0 <= bbox["x2"] <= 1.0
            assert 0.0 <= bbox["y2"] <= 1.0
            assert 0.0 <= bbox["width"] <= 1.0
            assert 0.0 <= bbox["height"] <= 1.0
            # Pixel coords match image dimensions
            px = bbox["pixel"]
            assert px["x1"] >= 0
            assert px["y1"] >= 0
            assert px["x2"] <= 640
            assert px["y2"] <= 480
            # Stable ID format
            assert det["id"].startswith("det_")
