import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr

class SolicitudCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    telefono: str
    marca: str
    modelo: str
    anio: int | None = None
    patente: str | None = None
    descripcion_danio: str

class SolicitudUpdate(BaseModel):
    estado: str | None = None
    respuesta: str | None = None

class ImagenSolicitudOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    url: str

class SolicitudOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    nombre: str
    apellido: str
    email: str
    telefono: str
    marca: str
    modelo: str
    anio: int | None
    patente: str | None
    descripcion_danio: str
    estado: str
    respuesta: str | None
    respuesta_at: datetime | None
    created_at: datetime
    imagenes: list[ImagenSolicitudOut] = []
