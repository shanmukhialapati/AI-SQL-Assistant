<div align="center">

# SQL Desk: AI SQL Assistant

**Upload Excel or CSV files, store them in PostgreSQL, and query them in plain English.**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-Gemini-1C3C3C)

</div>

---

## Overview

SQL Desk is a full-stack AI database workspace. Users sign in, upload spreadsheets, and the app turns each sheet into a permanent PostgreSQL table. They can then ask questions in plain English, review the generated SQL, run it safely, see the results as a table or chart, and export them.

It is built for people who know their data but not SQL, and for developers who want a fast way to explore spreadsheet data with real SQL.

<!-- Add screenshots to docs/screenshots/ and uncomment:
![Workspace](docs/screenshots/workspace.png)
-->

## Demo

<!-- OPTION 1 (recommended): upload the video straight to GitHub.
     Open this README with the pencil icon on github.com, drag your demo.mp4 (under 100 MB)
     into the editor, and GitHub inserts a link like
     https://github.com/user-attachments/assets/xxxxxxxx
     Keep that link on its own line and it plays inline. Paste it below. -->

<!-- https://github.com/user-attachments/assets/REPLACE_WITH_YOUR_VIDEO_ID -->

<!-- OPTION 2: YouTube or Loom thumbnail that links to the video. Replace VIDEO_ID.

[![SQL Desk demo](https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)](https://youtu.be/VIDEO_ID)
-->

<!-- OPTION 3: short looping GIF stored in the repo.

![SQL Desk demo](docs/demo/preview.gif)
-->

Want to try it yourself? Use the sample files in [`docs/demo`](docs/demo) (`employees.csv`, `departments.csv`) and follow the walkthrough in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

## Features

**Data**
- Upload `.xlsx`, `.xls` and `.csv` files, with multi-sheet support
- Preview columns, inferred types, empty cells and duplicate rows before importing
- Choose the table name and what happens if it exists: error, replace or append
- Permanent storage in PostgreSQL, with safe table and column names

**AI (Google Gemini via LangChain)**
- **Write SQL:** turn a plain-English question into a PostgreSQL query
- **Explain:** beginner-friendly, step-by-step explanation of any query
- **Fix with AI:** repair a failing query using the database error, with one-click undo

**Querying and results**
- Editable SQL editor with `Ctrl + Enter` to run
- Sortable result table with timing and row counts
- Bar, line and pie charts, and KPI cards for single-row results
- Download results as CSV or Excel (up to 100,000 rows by default)

**Accounts and persistence**
- Email and password sign-up with bcrypt hashing and JWT sessions
- A private PostgreSQL schema for every user
- Saved queries, query history and an editor draft that survive refreshes

## Architecture

```mermaid
flowchart LR
    A[React + TypeScript UI] -->|REST + JWT| B[FastAPI]
    B --> C[pandas + openpyxl<br/>file parsing]
    B --> D[SQL validator]
    D --> E[(PostgreSQL<br/>per-user schemas)]
    B --> F[LangChain]
    F --> G[Google Gemini]
    B --> E
```

**Flow:** upload and preview a file, import it into the user's schema, ask a question, validate the generated SQL, run it in a read-only transaction, then show and export the results.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Recharts |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Data processing | pandas, openpyxl, xlrd |
| Database | PostgreSQL 16 |
| AI | LangChain, Google Gemini |
| Auth | bcrypt, PyJWT |

## Project structure

```
ai-sql-assistant/
├── docker-compose.yml          # PostgreSQL for local development
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py             # App setup, CORS, router registration
│       ├── config.py           # Environment settings
│       ├── database.py         # Engine and table initialisation
│       ├── routers/            # auth, uploads, tables, query, ai, history
│       └── services/           # file parsing, import, schema, SQL validation,
│                               # query execution, export, AI, auth
└── frontend/
    ├── package.json
    └── src/
        ├── App.tsx
        ├── api.ts              # Typed API client
        ├── styles.css
        └── components/         # AuthPage, UploadPanel, SqlWorkspace,
                                # ResultsView, ChartPanel, TablesSidebar, SavedPanel
```

## Getting started

### Prerequisites

- Python 3.12
- Node.js 18 or newer
- PostgreSQL 14 or newer, or Docker
- A free [Gemini API key](https://aistudio.google.com/apikey) (optional, needed only for AI features)

### 1. Clone the repository

```bash
git clone https://github.com/shanmukhialapati/ai-sql-assistant.git
cd ai-sql-assistant
```

### 2. Start PostgreSQL

With Docker:

```bash
docker compose up -d
```

Or create the database yourself:

```sql
CREATE DATABASE ai_sql_assistant;
```

### 3. Run the backend

**Windows (PowerShell)**

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

**macOS / Linux**

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`: set `DATABASE_URL`, a long random `JWT_SECRET`, and `GEMINI_API_KEY`. Generate a secret with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs are available at http://localhost:8000/docs.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, create an account and upload a file.

## Configuration

All settings live in `backend/.env`.

| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_URL` | SQLAlchemy URL, e.g. `postgresql+psycopg://user:pass@localhost:5432/ai_sql_assistant` | required |
| `JWT_SECRET` | Secret used to sign login tokens (16+ characters) | required |
| `JWT_EXPIRE_MIN` | Token lifetime in minutes | `1440` |
| `GEMINI_API_KEY` | Google AI Studio API key | empty (AI disabled) |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `MAX_UPLOAD_MB` | Maximum upload size | `10` |
| `MAX_ROWS` | Maximum rows per imported sheet | `100000` |
| `QUERY_ROW_LIMIT` | Rows returned to the UI per query | `1000` |
| `QUERY_TIMEOUT_MS` | Per-query timeout | `10000` |
| `EXPORT_ROW_LIMIT` | Maximum rows in CSV or Excel exports | `100000` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173` |

## Usage example

1. Sign up and upload `employees.csv`:

   ```csv
   employee_id,name,department,salary
   1,Ravi,IT,60000
   2,Priya,HR,45000
   3,Arun,IT,75000
   4,Sita,Finance,55000
   ```

2. Ask: **"Average salary by department"**
3. Review the generated SQL:

   ```sql
   SELECT department, ROUND(AVG(salary), 2) AS avg_salary
   FROM employees
   GROUP BY department
   ORDER BY avg_salary DESC;
   ```

4. Run it, switch to the **Chart** tab, and download the result as CSV or Excel.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register`, `/api/auth/login` | Create an account or sign in |
| `GET` | `/api/auth/me` | Current user |
| `POST` | `/api/uploads/preview` | Parse a file and preview it (nothing is saved) |
| `POST` | `/api/uploads/import` | Import a sheet into PostgreSQL |
| `GET` | `/api/tables` | List your tables |
| `GET` / `DELETE` | `/api/tables/{name}` | Table schema and sample rows, or delete |
| `POST` | `/api/query` | Run a read-only query |
| `POST` | `/api/query/export` | Download results as CSV or XLSX |
| `POST` | `/api/ai/generate-sql` | Natural language to SQL |
| `POST` | `/api/ai/explain` | Explain a query |
| `POST` | `/api/ai/fix-sql` | Repair a failing query |
| `GET` / `DELETE` | `/api/history` | Query history |
| `GET` / `POST` / `DELETE` | `/api/saved`, `/api/saved/{id}` | Saved queries |
| `GET` | `/api/health` | Service and database health |

All endpoints except auth and health require an `Authorization: Bearer <token>` header.

## Security

- **Read-only execution:** only a single `SELECT` or `WITH` statement is accepted. Write and DDL keywords are blocked, and queries run in a read-only transaction that is always rolled back.
- **Limits:** every query has a timeout and a row limit, and uploads have size and row limits.
- **User isolation:** each user's tables live in their own schema. Queries run with that schema on the search path, and references to other schemas and app tables are blocked.
- **Safe imports:** table and column names are sanitised, and data is inserted through parameterised batches rather than executed as SQL.
- **Authentication:** passwords are hashed with bcrypt and sessions use signed JWTs.
- **AI privacy:** only table and column names and types are sent to Gemini. Row data is never sent.

**Known limitations**
- Isolation relies on the search path and a keyword validator. For stricter production isolation, use a dedicated read-only database role limited to each user's schema.
- The token is stored in `localStorage`. Production deployments should prefer httpOnly cookies.
- There is no login rate limiting yet.

## Roadmap

- [ ] Monaco editor with SQL syntax highlighting and schema-aware autocomplete
- [ ] Schema explorer with ER diagram
- [ ] Data profiling (nulls, duplicates, distributions)
- [ ] Multi-turn chat with follow-up questions
- [ ] Docker setup for the full stack
- [ ] Automated tests and CI
- [ ] Support for MySQL and SQLite

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `DATABASE_URL is missing` or `JWT_SECRET` error on start | Create `backend/.env` from `.env.example` and fill both values |
| `Cannot reach the backend` in the UI | Make sure Uvicorn is running on port 8000 and `CORS_ORIGINS` includes your frontend URL |
| `GEMINI_API_KEY is not set` | Add your key to `backend/.env` and restart the backend |
| Gemini request fails with a model error | Set `GEMINI_MODEL` to a model currently available in Google AI Studio |
| PowerShell blocks virtualenv activation | Run `.\.venv\Scripts\python.exe` directly, or allow scripts for your user |
| Old tables are missing after adding login | Tables uploaded before accounts existed are in `public`; upload them again |

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, and open a pull request describing your change.

## License

Distributed under the MIT License. Add a `LICENSE` file to the repository root before publishing.

## Author


**Alapati Shanmukhi**
[GitHub](https://github.com/shanmukhialapati) · [LinkedIn](https://linkedin.com/in/alapati-shanmukhi)
