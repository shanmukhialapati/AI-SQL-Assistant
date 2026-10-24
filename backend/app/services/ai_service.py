from fastapi import HTTPException
from langchain_core.prompts import ChatPromptTemplate

from app.config import GEMINI_API_KEY, GEMINI_MODEL
from app.services.schema_service import full_schema_text

GENERATE = """You are an expert PostgreSQL analyst.
Given the database schema, write ONE read-only PostgreSQL SELECT query that answers the question.
Rules: use only tables and columns in the schema; double-quote identifiers only if needed;
never modify data; add LIMIT 100 unless the user asks for aggregates.
Return only the SQL, no markdown fences and no explanation.

Schema:
{schema}
"""

EXPLAIN = """You explain PostgreSQL queries to beginners.
Using the schema below, explain what the query does in plain language: first one sentence
summarising the result, then short numbered steps (FROM/JOIN, WHERE, GROUP BY, ORDER BY, etc.)
covering only the parts that are present. Define any window function or subquery in one line.
Do not rewrite the query. Use plain text, no markdown headings.

Schema:
{schema}
"""

FIX = """You repair PostgreSQL queries.
Given the schema, a failing query and its error message, return ONE corrected read-only SELECT query
that keeps the original intent. Use only tables and columns that exist in the schema.
Return only the SQL, no markdown fences and no explanation.

Schema:
{schema}
"""


def _text(content) -> str:
    """Gemini may return a string or a list of content parts."""
    if isinstance(content, str):
        return content
    out = []
    for part in content:
        if isinstance(part, str):
            out.append(part)
        elif isinstance(part, dict):
            out.append(part.get("text", ""))
    return "".join(out)


def _clean_sql(text: str) -> str:
    return text.replace("```sql", "").replace("```", "").strip()


def _ask(system: str, human: str, schema: str) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(503, "GEMINI_API_KEY is not set in backend/.env")
    if not schema:
        raise HTTPException(400, "No tables yet. Upload a file first.")

    from langchain_google_genai import ChatGoogleGenerativeAI

    llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, google_api_key=GEMINI_API_KEY, temperature=0)
    chain = ChatPromptTemplate.from_messages([("system", system), ("human", "{input}")]) | llm
    try:
        return _text(chain.invoke({"schema": schema, "input": human}).content)
    except Exception as exc:
        raise HTTPException(502, f"Gemini request failed: {exc}")


def generate_sql(question: str, schema: str) -> str:
    return _clean_sql(_ask(GENERATE, question, full_schema_text(schema)))


def explain_sql(sql: str, schema: str) -> str:
    return _ask(EXPLAIN, f"Query:\n{sql}", full_schema_text(schema)).strip()


def fix_sql(sql: str, error: str, schema: str) -> str:
    human = f"Query:\n{sql}\n\nError:\n{error}"
    return _clean_sql(_ask(FIX, human, full_schema_text(schema)))
