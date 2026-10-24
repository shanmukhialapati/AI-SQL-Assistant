import time
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config import QUERY_ROW_LIMIT, QUERY_TIMEOUT_MS
from app.database import engine
from app.services.sql_validator import validate_select_only


def run_query(sql: str, schema: str, limit: int = QUERY_ROW_LIMIT) -> dict:
    sql = validate_select_only(sql)
    started = time.perf_counter()
    try:
        # Read-only transaction + timeout + user's own schema; always rolled back.
        with engine.connect() as conn:
            conn.execute(text("SET TRANSACTION READ ONLY"))
            conn.execute(text(f"SET LOCAL statement_timeout = {int(QUERY_TIMEOUT_MS)}"))
            conn.execute(text(f'SET LOCAL search_path TO "{schema}"'))
            result = conn.execute(text(sql))
            columns = list(result.keys())
            rows = result.fetchmany(limit + 1)
            conn.rollback()
    except SQLAlchemyError as exc:
        msg = str(getattr(exc, "orig", exc)).split("\n")[0]
        raise HTTPException(400, f"SQL error: {msg}")

    truncated = len(rows) > limit
    rows = rows[:limit]
    return {
        "columns": columns,
        "rows": [[_jsonable(v) for v in r] for r in rows],
        "row_count": len(rows),
        "truncated": truncated,
        "elapsed_ms": round((time.perf_counter() - started) * 1000, 1),
    }


def _jsonable(v):
    if v is None or isinstance(v, (int, float, str, bool)):
        return v
    if isinstance(v, Decimal):
        return float(v)  # so charts get real numbers (e.g. AVG results)
    return str(v)
