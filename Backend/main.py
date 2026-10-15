from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn

from app.config import settings
from app.routers.auth import router as auth_router
from app.routers.employees import router as employees_router
from app.routers.attendance import router as attendance_router
from app.routers.enrollment import router as enrollment_router
from app.routers.leaves import router as leaves_router
from app.routers.settings import router as settings_router
from app.services.scheduler_service import start_scheduler, shutdown_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AI Face Attendance Application...")
    start_scheduler()
    yield
    logger.info("Shutting down Application...")
    shutdown_scheduler()

app = FastAPI(
    title="AI Face Attendance System API",
    description="Backend API powered by SCRFD, ArcFace 512D Vector Embeddings, Geofencing, and Supabase",
    version="1.0.0",
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(employees_router)
app.include_router(attendance_router)
app.include_router(enrollment_router)
app.include_router(leaves_router)
app.include_router(settings_router)

@app.get("/")
def root():
    return {
        "service": "AI Face Attendance System API",
        "status": "online",
        "models": {
            "detection": "SCRFD",
            "recognition": "ArcFace 512D",
            "security": "Anti-Spoofing / Liveness Check",
            "geofencing": "Enabled"
        }
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
