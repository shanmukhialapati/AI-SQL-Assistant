import re

import sqlparse
from fastapi import HTTPException

FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|"
    r"call|do|execute|vacuum|reindex|pg_sleep|set|lock)\b",
    re.IGNORECASE,
)


# Users may only touch their own tables: block other schemas and app/system tables.
BLOCKED_REFS = re.compile(
    r"\b(public|information_schema|pg_\w+|app_\w+|u_\d+)\b", re.IGNORECASE
)


def validate_select_only(sql: str) -> str:
    """Allow a single read-only SELECT / WITH statement. Returns cleaned SQL."""
    sql = sql.strip().rstrip(";").strip()
    if not sql:
        raise HTTPException(400, "SQL is empty.")

    statements = [s for s in sqlparse.parse(sql) if str(s).strip()]
    if len(statements) != 1:
        raise HTTPException(400, "Only one SQL statement is allowed.")

    # Strip string literals before keyword scan so 'delete' inside text is fine.
    no_strings = re.sub(r"'(?:[^']|'')*'", "''", sql)
    first = no_strings.lstrip().split(None, 1)[0].lower()
    if first not in {"select", "with"}:
        raise HTTPException(400, "Only SELECT queries are allowed.")
    if FORBIDDEN.search(no_strings):
        raise HTTPException(400, "This query contains a blocked keyword. Only read-only queries are allowed.")
    if BLOCKED_REFS.search(no_strings):
        raise HTTPException(400, "This query references a table or schema you cannot access.")
    return sql
