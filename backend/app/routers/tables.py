from fastapi import APIRouter, Depends, HTTPException

from app.services import schema_service
from app.services.auth_service import current_user
from app.services.query_service import run_query

router = APIRouter(prefix="/api/tables", tags=["tables"])


@router.get("")
def get_tables(user: dict = Depends(current_user)):
    return schema_service.list_tables(user["schema"])


@router.get("/{name}")
def get_table(name: str, user: dict = Depends(current_user)):
    info = schema_service.table_schema(name, user["schema"])
    if not info:
        raise HTTPException(404, "Table not found.")
    info["sample"] = run_query(f'SELECT * FROM "{name}" LIMIT 5', user["schema"])
    return info


@router.delete("/{name}")
def delete_table(name: str, user: dict = Depends(current_user)):
    if not schema_service.drop_table(name, user["schema"]):
        raise HTTPException(404, "Table not found.")
    return {"deleted": name}
