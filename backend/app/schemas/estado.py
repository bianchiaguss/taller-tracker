import uuid

from pydantic import BaseModel, ConfigDict


class EstadoBase(BaseModel):
    nombre: str
    orden: int
    color: str = "#2563EB"
    descripcion: str | None = None
    es_estado_final: bool = False


class EstadoCreate(EstadoBase):
    pass


class EstadoUpdate(BaseModel):
    nombre: str | None = None
    orden: int | None = None
    color: str | None = None
    descripcion: str | None = None
    es_estado_final: bool | None = None
    activo: bool | None = None


class EstadoOut(EstadoBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    activo: bool
