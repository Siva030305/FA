import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from Backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    FOUNDER_SETUP_CODE: str = os.getenv("FOUNDER_SETUP_CODE", "")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

    MODELS_DIR: Path = BASE_DIR / "models"

settings = Settings()
