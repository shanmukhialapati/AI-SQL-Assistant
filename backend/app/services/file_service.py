import re
from io import BytesIO
from pathlib import Path

import pandas as pd
from fastapi import HTTPException, UploadFile

from app.config import MAX_ROWS, MAX_UPLOAD_MB

ALLOWED_EXTENSIONS = {".xlsx", ".xls", ".csv"}

RESERVED = {
    "select", "from", "where", "table", "user", "order", "group", "limit",
    "insert", "update", "delete", "drop", "create", "alter", "index", "join",
}


def clean_identifier(value: str, fallback: str = "column") -> str:
    """Turn any text into a safe PostgreSQL identifier."""
    value = str(value).strip().lower()
    value = re.sub(r"[^a-z0-9_]+", "_", value)
    value = re.sub(r"_+", "_", value).strip("_")
    if not value:
        value = fallback
    if value[0].isdigit():
        value = f"col_{value}"
    if value in RESERVED:
        value = f"{value}_"
    return value[:50]


def make_unique_columns(columns) -> list[str]:
    seen: dict[str, int] = {}
    result = []
    for i, col in enumerate(columns):
        name = clean_identifier(col, fallback=f"column_{i + 1}")
        if name in seen:
            seen[name] += 1
            name = f"{name[:45]}_{seen[name]}"
        else:
            seen[name] = 0
        result.append(name)
    return result


async def read_upload(file: UploadFile) -> tuple[str, bytes]:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Use .xlsx, .xls or .csv.")
    content = await file.read()
    if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(413, f"File is larger than {MAX_UPLOAD_MB} MB.")
    if not content:
        raise HTTPException(400, "The file is empty.")
    return ext, content


def list_sheets(ext: str, content: bytes) -> list[str]:
    if ext == ".csv":
        return ["data"]
    try:
        return pd.ExcelFile(BytesIO(content)).sheet_names
    except Exception as exc:
        raise HTTPException(400, f"Could not read the Excel file: {exc}")


def read_sheet(ext: str, content: bytes, sheet: str | None) -> pd.DataFrame:
    try:
        if ext == ".csv":
            try:
                df = pd.read_csv(BytesIO(content))
            except UnicodeDecodeError:
                df = pd.read_csv(BytesIO(content), encoding="latin-1")
        else:
            df = pd.read_excel(BytesIO(content), sheet_name=sheet or 0)
    except Exception as exc:
        raise HTTPException(400, f"Could not parse the file: {exc}")

    df = df.dropna(how="all").dropna(axis=1, how="all")
    if df.empty:
        raise HTTPException(400, "No data found in this sheet.")
    if len(df) > MAX_ROWS:
        raise HTTPException(413, f"Too many rows ({len(df)}). Limit is {MAX_ROWS}.")

    df.columns = make_unique_columns(df.columns)
    return df.convert_dtypes()


def profile(df: pd.DataFrame) -> list[dict]:
    return [
        {
            "name": c,
            "type": str(df[c].dtype),
            "nulls": int(df[c].isna().sum()),
        }
        for c in df.columns
    ]


def preview_rows(df: pd.DataFrame, n: int = 10) -> list[dict]:
    return df.head(n).astype(object).where(df.head(n).notna(), None).to_dict(orient="records")
