import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    AI_SERVICE_TOKEN: str = os.getenv("AI_SERVICE_TOKEN", "aicademy_internal_ai_token_2026")
    MODEL_NAME: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "800"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "150"))

settings = Settings()

