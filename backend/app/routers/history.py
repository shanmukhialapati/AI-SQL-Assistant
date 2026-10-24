from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.database import engine
from app.services.auth_service import current_user

router = APIRouter(prefix="/api", tags=["history"])


class SaveIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    sql: str = Field(min_length=1, max_length=20000)


@router.get("/history")
def get_history(user: dict = Depends(current_user)):
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, question, sql, created_at FROM app_query_history "
                 "WHERE user_id = :u ORDER BY id DESC LIMIT 50"),
            {"u": user["id"]},
        ).all()
    return [{"id": r.id, "question": r.question, "sql": r.sql, "created_at": r.created_at.isoformat()} for r in rows]


@router.delete("/history")
def clear_history(user: dict = Depends(current_user)):
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM app_query_history WHERE user_id = :u"), {"u": user["id"]})
    return {"cleared": True}


@router.get("/saved")
def get_saved(user: dict = Depends(current_user)):
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, name, sql FROM app_saved_queries WHERE user_id = :u ORDER BY id DESC"),
            {"u": user["id"]},
        ).all()
    return [{"id": r.id, "name": r.name, "sql": r.sql} for r in rows]


@router.post("/saved")
def save_query(body: SaveIn, user: dict = Depends(current_user)):
    with engine.begin() as conn:
        new_id = conn.execute(
            text("INSERT INTO app_saved_queries (user_id, name, sql) VALUES (:u, :n, :s) RETURNING id"),
            {"u": user["id"], "n": body.name.strip(), "s": body.sql},
        ).scalar()
    return {"id": new_id}


@router.delete("/saved/{saved_id}")
def delete_saved(saved_id: int, user: dict = Depends(current_user)):
    with engine.begin() as conn:
        res = conn.execute(
            text("DELETE FROM app_saved_queries WHERE id = :i AND user_id = :u"),
            {"i": saved_id, "u": user["id"]},
        )
    if res.rowcount == 0:
        raise HTTPException(404, "Saved query not found.")
    return {"deleted": saved_id}
