from typing import Literal

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy import text

from app.config import EXPORT_ROW_LIMIT
from app.database import engine
from app.services import export_service
from app.services.auth_service import current_user
from app.services.query_service import run_query

router = APIRouter(prefix="/api/query", tags=["query"])


class QueryIn(BaseModel):
    sql: str
    question: str | None = None


class ExportIn(BaseModel):
    sql: str
    format: Literal["csv", "xlsx"] = "csv"


@router.post("")
def execute(body: QueryIn, user: dict = Depends(current_user)):
    result = run_query(body.sql, user["schema"])
    with engine.begin() as conn:  # only successful queries are stored
        conn.execute(
            text("INSERT INTO app_query_history (user_id, question, sql) VALUES (:u, :q, :s)"),
            {"u": user["id"], "q": body.question, "s": body.sql.strip()},
        )
    return result


@router.post("/export")
def export(body: ExportIn, user: dict = Depends(current_user)):
    result = run_query(body.sql, user["schema"], limit=EXPORT_ROW_LIMIT)
    if body.format == "xlsx":
        data = export_service.to_xlsx(result["columns"], result["rows"])
        media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        data = export_service.to_csv(result["columns"], result["rows"])
        media = "text/csv; charset=utf-8"
    return Response(
        content=data,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="results.{body.format}"'},
    )
