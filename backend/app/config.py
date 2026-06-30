import os
from dotenv import load_dotenv

# Load environmental variables
load_dotenv()

class Settings:
    # Application environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # CORS — Frontend URL allowed to access the backend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")

    # AI Provider configuration
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "")

    # File upload limits
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", 5 * 1024 * 1024))  # 5MB
    ALLOWED_EXTENSIONS: set = {"pdf", "docx"}

settings = Settings()
