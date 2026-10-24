import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    APP_NAME: str = "ReMatter AI"
    APP_VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Model configuration - supports REMATTER_MODEL or legacy MODEL_PATH
    REMATTER_MODEL: str = os.getenv("REMATTER_MODEL") or os.getenv("MODEL_PATH") or "yolov8n.pt"
    MODEL_PATH: str = os.getenv("REMATTER_MODEL") or os.getenv("MODEL_PATH") or "yolov8n.pt"
    
    # Inference parameters
    DEFAULT_CONFIDENCE: float = float(os.getenv("DEFAULT_CONFIDENCE", "0.35"))
    NMS_IOU_THRESHOLD: float = float(os.getenv("REMATTER_NMS_IOU", "0.45"))  # NMS IoU threshold for overlapping/cluttered objects
    DEVICE: str = os.getenv("DEVICE", "cpu")  # auto-detected or overridden
    
    # Gemini Vision API configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    VISION_ENGINE: str = os.getenv("VISION_ENGINE", "auto")  # "gemini", "yolo", or "auto"
    
    # Concurrency and safety limits
    MAX_CONCURRENT_INFERENCES: int = int(os.getenv("MAX_CONCURRENT_INFERENCES", "4"))
    MAX_IMAGE_SIZE_BYTES: int = int(os.getenv("MAX_IMAGE_SIZE_BYTES", str(25 * 1024 * 1024)))  # 25 MB
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]


settings = Settings()
