from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.config import DATABASE_URL

engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True)

INIT_SQL = [
    """CREATE TABLE IF NOT EXISTS app_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now())""",
    """CREATE TABLE IF NOT EXISTS app_query_history (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        question TEXT,
        sql TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now())""",
    """CREATE TABLE IF NOT EXISTS app_saved_queries (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sql TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now())""",
]


def init_db() -> None:
    with engine.begin() as conn:
        for stmt in INIT_SQL:
            conn.execute(text(stmt))
