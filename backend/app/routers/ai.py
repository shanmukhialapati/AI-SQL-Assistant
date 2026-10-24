from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.services import ai_service
from app.services.auth_service import current_user
from app.services.sql_validator import validate_select_only

router = APIRouter(prefix="/api/ai", tags=["ai"])


class AskIn(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class SqlIn(BaseModel):
    sql: str = Field(min_length=1, max_length=20000)


class FixIn(SqlIn):
    error: str = Field(default="", max_length=4000)


@router.post("/generate-sql")
def generate(body: AskIn, user: dict = Depends(current_user)):
    return {"sql": validate_select_only(ai_service.generate_sql(body.question, user["schema"]))}


@router.post("/explain")
def explain(body: SqlIn, user: dict = Depends(current_user)):
    return {"explanation": ai_service.explain_sql(body.sql, user["schema"])}


@router.post("/fix-sql")
def fix(body: FixIn, user: dict = Depends(current_user)):
    fixed = ai_service.fix_sql(body.sql, body.error, user["schema"])
    return {"sql": validate_select_only(fixed)}
