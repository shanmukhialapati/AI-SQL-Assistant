from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine
from app.services.auth_service import (
    current_user, hash_password, make_token, schema_for, verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class Credentials(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if len(v.encode()) > 72:
            raise ValueError("Password must be 72 bytes or fewer.")
        return v


@router.post("/register")
def register(body: Credentials):
    email = body.email.lower()
    try:
        with engine.begin() as conn:
            user_id = conn.execute(
                text("INSERT INTO app_users (email, password_hash) VALUES (:e, :p) RETURNING id"),
                {"e": email, "p": hash_password(body.password)},
            ).scalar()
            conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema_for(user_id)}"'))
    except IntegrityError:
        raise HTTPException(409, "An account with this email already exists.")
    return {"token": make_token(user_id), "email": email}


@router.post("/login")
def login(body: Credentials):
    email = body.email.lower()
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, password_hash FROM app_users WHERE email = :e"), {"e": email}
        ).first()
    if not row or not verify_password(body.password, row.password_hash):
        raise HTTPException(401, "Wrong email or password.")
    return {"token": make_token(row.id), "email": email}


@router.get("/me")
def me(user: dict = Depends(current_user)):
    return {"email": user["email"]}
