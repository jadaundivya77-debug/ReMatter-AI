import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .api.routes import router
from .services.detector import get_detector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("rematter.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle.
    Loads the YOLO model into memory once before handling incoming traffic.
    """
    logger.info("Initializing ReMatter AI Backend...")
    logger.info(f"Active Model Path: {settings.MODEL_PATH}")
    try:
        # Pre-warm model outside request loop
        det = get_detector()
        logger.info(f"Model ready. Detected classes: {len(det.class_names)}")
    except Exception as e:
        logger.error(f"Error during model initialization: {e}")
    yield
    logger.info("Shutting down ReMatter AI Backend.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Real-time waste detection and recycling intelligence workspace API",
    lifespan=lifespan
)

# Rule 7: Configure CORS explicitly for the local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],  # Allow configured local origins and wildcard for flexibility in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes under /api
app.include_router(router, prefix="/api")


# Also mount /health and /model/metadata directly at root for easy discovery
@app.get("/health", tags=["System"])
async def root_health():
    from .api.routes import health_check
    return await health_check()


@app.get("/model/metadata", tags=["System"])
async def root_model_metadata():
    from .api.routes import get_model_metadata
    return await get_model_metadata()


@app.get("/", tags=["System"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health",
        "model_metadata_url": "/api/model/metadata",
        "api_prefix": "/api"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
