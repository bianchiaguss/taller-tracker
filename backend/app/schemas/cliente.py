import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.usuario import UsuarioOut


class ClienteCreate(BaseModel):
    """El admin crea el cliente junto con su usuario de acceso en un solo paso."""
    email: EmailStr
    password: str
    nombre: str
    apellido: str
    telefono: str | None = None
    dni_cuit: str | None = None
    direccion: str | None = None
    telefono_alternativo: str | None = None


class ClienteUpdate(BaseModel):
    dni_cuit: str | None = None
    direccion: str | None = None
    telefono_alternativo: str | None = None


class ClienteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dni_cuit: str | None
    direccion: str | None
    telefono_alternativo: str | None
    usuario: UsuarioOut
    created_at: datetime


class ClienteUpdateCompleto(BaseModel):
    """Edición completa: campos del Usuario + del Cliente."""
    nombre: str | None = None
    apellido: str | None = None
    email: str | None = None
    telefono: str | None = None
    dni_cuit: str | None = None
    direccion: str | None = None
    telefono_alternativo: str | None = None
