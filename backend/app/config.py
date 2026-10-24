import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing from .env")

MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "10"))
MAX_ROWS = int(os.getenv("MAX_ROWS", "100000"))
QUERY_ROW_LIMIT = int(os.getenv("QUERY_ROW_LIMIT", "1000"))
QUERY_TIMEOUT_MS = int(os.getenv("QUERY_TIMEOUT_MS", "10000"))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
EXPORT_ROW_LIMIT = int(os.getenv("EXPORT_ROW_LIMIT", "100000"))
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]

JWT_SECRET = os.getenv("JWT_SECRET", "")
if len(JWT_SECRET) < 16:
    raise RuntimeError("Set JWT_SECRET (16+ characters) in .env")
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", "1440"))
