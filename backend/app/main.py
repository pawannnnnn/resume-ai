import sys
import os
import time
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.resume import router
from routes.auth import router as auth_router
from routes.admin import router as admin_router
from config import settings
from utils.logger import logger
from services.ai.provider_factory import ProviderFactory
from db.database import engine, Base

# ---------------------------------------------------------------------------
# Lifespan — startup & shutdown hooks
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"ResumeAI API starting (environment={settings.ENVIRONMENT})")
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup on shutdown
    ProviderFactory.close()
    logger.info("ResumeAI API shutting down — resources released.")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Resume AI API",
    description="Backend API for AI-powered resume analysis, optimization, and generation.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)


# ---------------------------------------------------------------------------
# CORS configuration
# ---------------------------------------------------------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add the deployed frontend URL if configured
if settings.FRONTEND_URL:
    frontend_url = settings.FRONTEND_URL.rstrip('/')
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000

    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({duration_ms:.0f}ms)"
    )

    return response


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: "
        f"{type(exc).__name__}: {str(exc)}"
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please try again later.",
            "error_type": type(exc).__name__,
        },
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(router)
app.include_router(auth_router)
app.include_router(admin_router)

@app.get("/")
def home():
    return {
        "message": "Resume AI API Running",
        "docs": "/docs",
        "status": "healthy"
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
