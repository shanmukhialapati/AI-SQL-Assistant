# AI SQL Assistant

Upload Excel/CSV files -> permanent PostgreSQL tables -> run SQL or ask in plain English.

## Run it (Windows PowerShell)

### 1. Database (pick one)
- Docker: `docker compose up -d`  (user/pass: postgres/postgres)
- Or install PostgreSQL and run `CREATE DATABASE ai_sql_assistant;`

### 2. Backend
```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env      # edit DATABASE_URL, JWT_SECRET (long random text), GEMINI_API_KEY (free key: https://aistudio.google.com/apikey)
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### 3. Frontend
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## Structure
- backend/app/routers   uploads.py, tables.py, query.py, ai.py
- backend/app/services  file_service.py, import_service.py, schema_service.py, sql_validator.py, ai_service.py
- frontend/src/components  UploadPanel, TablesSidebar, SqlWorkspace, ResultsTable

## Roadmap
1. Done: upload, import, schema browser, safe SQL runner, AI SQL generation
2. Next: chat history, saved queries, SQL explain/fix, charts (Recharts), CSV export
3. Later: auth + per-user schemas, Monaco editor, Docker for the app, tests

## Login and storage
- Sign up / sign in with email + password (bcrypt hashes, JWT token kept in the browser).
- Every user gets a private PostgreSQL schema (`u_<id>`); uploaded tables live there permanently.
- Query history and saved queries are stored in PostgreSQL; the SQL editor draft is kept in the browser.
- Tables from before login was added sit in `public` and are not visible; upload them again.

## AI, charts and export
- AI uses Google Gemini through LangChain (`GEMINI_API_KEY`, model via `GEMINI_MODEL`).
- Write SQL (plain English), Explain (beginner-friendly), Fix with AI (after an error, with Undo).
- Results have Table and Chart tabs (bar, line, pie; a single row becomes KPI cards).
- Download the full result as CSV or Excel (up to EXPORT_ROW_LIMIT rows).
