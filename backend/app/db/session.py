"""Dependencia de FastAPI para obtener una sesion de base de datos por request."""
from collections.abc import Generator

from app.db.base import SessionLocal


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
