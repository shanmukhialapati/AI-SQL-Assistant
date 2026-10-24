from sqlalchemy import inspect, text

from app.database import engine


def list_tables(schema: str) -> list[dict]:
    insp = inspect(engine)
    out = []
    with engine.connect() as conn:
        for t in sorted(insp.get_table_names(schema=schema)):
            count = conn.execute(text(f'SELECT COUNT(*) FROM "{schema}"."{t}"')).scalar()
            out.append({"name": t, "rows": count, "columns": len(insp.get_columns(t, schema=schema))})
    return out


def table_schema(table: str, schema: str) -> dict:
    insp = inspect(engine)
    if table not in insp.get_table_names(schema=schema):
        return {}
    cols = [{"name": c["name"], "type": str(c["type"])} for c in insp.get_columns(table, schema=schema)]
    return {"name": table, "columns": cols}


def full_schema_text(schema: str) -> str:
    """Compact schema for the LLM: metadata only, no row data."""
    lines = []
    for t in list_tables(schema):
        info = table_schema(t["name"], schema)
        cols = ", ".join(f'{c["name"]} {c["type"]}' for c in info["columns"])
        lines.append(f'{t["name"]}({cols})')
    return "\n".join(lines)


def drop_table(table: str, schema: str) -> bool:
    if table not in inspect(engine).get_table_names(schema=schema):
        return False
    with engine.begin() as conn:
        conn.execute(text(f'DROP TABLE "{schema}"."{table}"'))
    return True
