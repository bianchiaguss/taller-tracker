import uuid
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

class OpinionCreate(BaseModel):
    nombre: str
    fecha: date
    calificacion: int   # 1-5
    comentario: str

class OpinionUpdate(BaseModel):
    nombre: str | None = None
    calificacion: int | None = None
    comentario: str | None = None
    activo: bool | None = None

class OpinionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    nombre: str
    fecha: date
    calificacion: int
    comentario: str
    activo: bool
    fuente: str
    created_at: datetime
