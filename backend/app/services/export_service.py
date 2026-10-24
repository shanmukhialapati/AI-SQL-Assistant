import csv
from io import BytesIO, StringIO

import pandas as pd


def _safe(v):
    # Stop spreadsheet apps from running text that starts like a formula.
    if isinstance(v, str) and v[:1] in ("=", "+", "-", "@"):
        return "'" + v
    return v


def to_csv(columns: list[str], rows: list[list]) -> bytes:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(columns)
    for r in rows:
        w.writerow([_safe(v) for v in r])
    return ("\ufeff" + buf.getvalue()).encode("utf-8")  # BOM so Excel reads UTF-8


def to_xlsx(columns: list[str], rows: list[list]) -> bytes:
    df = pd.DataFrame([[_safe(v) for v in r] for r in rows], columns=columns)
    out = BytesIO()
    df.to_excel(out, index=False, engine="openpyxl")
    return out.getvalue()
