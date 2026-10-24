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


https://github.com/user-attachments/assets/532c6a06-905a-4508-8bbf-5e4995434986



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


## Contributing

Contributions are welcome. Fork the repository, create a feature branch, and open a pull request describing your change.

## License

Distributed under the MIT License. Add a `LICENSE` file to the repository root before publishing.

## Author


**Alapati Shanmukhi**
[GitHub](https://github.com/shanmukhialapati) · [LinkedIn](https://linkedin.com/in/alapati-shanmukhi)
