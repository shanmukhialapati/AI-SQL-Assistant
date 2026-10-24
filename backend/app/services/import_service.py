import pandas as pd
from fastapi import HTTPException
from sqlalchemy import inspect

from app.database import engine
from app.services.file_service import clean_identifier

SYSTEM_PREFIXES = ("pg_", "sql_", "app_")


def import_dataframe(df: pd.DataFrame, table_name: str, schema: str, mode: str = "fail") -> dict:
    """Write a DataFrame into a permanent PostgreSQL table.

    mode: 'fail' (error if exists), 'replace', or 'append'.
    """
    name = clean_identifier(table_name, fallback="imported_table")
    if name.startswith(SYSTEM_PREFIXES):
        raise HTTPException(400, "Table name is reserved. Choose another.")
    if mode not in {"fail", "replace", "append"}:
        raise HTTPException(400, "mode must be fail, replace or append.")

    exists = inspect(engine).has_table(name, schema=schema)
    if exists and mode == "fail":
        raise HTTPException(409, f"Table '{name}' already exists. Choose replace or append.")

    try:
        df.to_sql(name, engine, schema=schema, if_exists=mode, index=False, chunksize=1000, method="multi")
    except Exception as exc:
        raise HTTPException(400, f"Import failed: {exc}")

    return {"table": name, "rows": len(df), "columns": list(df.columns), "mode": mode}
