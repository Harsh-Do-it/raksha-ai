import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", os.getenv("ENV", "development"))
    DEBUG = os.getenv("FLASK_DEBUG", "1" if FLASK_ENV == "development" else "0").lower() in {"1", "true", "yes", "on"}
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "5000"))
    SECRET_KEY = os.getenv("SECRET_KEY", "raksha-ai-dev-secret")
    UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads")))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", "10485760"))
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
    FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
    FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL")
    FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
