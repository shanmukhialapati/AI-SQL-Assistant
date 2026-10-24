from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import CORS_ORIGINS
from app.database import engine, init_db
from app.routers import ai, auth, history, query, tables, uploads


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()  # creates users, history and saved-query tables if missing
    yield


app = FastAPI(title="AI SQL Assistant", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth, uploads, tables, query, ai, history):
    app.include_router(r.router)


@app.get("/api/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok"}
