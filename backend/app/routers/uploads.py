from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.services import file_service as fs
from app.services.auth_service import current_user
from app.services.import_service import import_dataframe

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("/preview")
async def preview(
    file: UploadFile = File(...),
    sheet: str | None = Form(None),
    user: dict = Depends(current_user),
):
    """Parse a file and return sheets, columns and the first rows. Nothing is saved."""
    ext, content = await fs.read_upload(file)
    sheets = fs.list_sheets(ext, content)
    selected = sheet if sheet in sheets else sheets[0]
    df = fs.read_sheet(ext, content, selected)
    return {
        "filename": file.filename,
        "sheets": sheets,
        "sheet": selected,
        "suggested_table": fs.clean_identifier(
            selected if ext != ".csv" else (file.filename or "data").rsplit(".", 1)[0],
            fallback="imported_table",
        ),
        "row_count": len(df),
        "columns": fs.profile(df),
        "preview": fs.preview_rows(df),
        "duplicate_rows": int(df.duplicated().sum()),
    }


@router.post("/import")
async def import_file(
    file: UploadFile = File(...),
    sheet: str | None = Form(None),
    table_name: str = Form(...),
    mode: str = Form("fail"),
    user: dict = Depends(current_user),
):
    ext, content = await fs.read_upload(file)
    df = fs.read_sheet(ext, content, sheet)
    return import_dataframe(df, table_name, user["schema"], mode)
