import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.usuario import RolUsuario


class UsuarioBase(BaseModel):
    email: EmailStr
    nombre: str
    apellido: str
    telefono: str | None = None


class UsuarioCreate(UsuarioBase):
    password: str
    rol: RolUsuario


class UsuarioOut(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    rol: RolUsuario
    activo: bool
    created_at: datetime
