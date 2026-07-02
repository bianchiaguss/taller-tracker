import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class GaleriaCreate(BaseModel):
    marca: str
    modelo: str
    anio: int | None = None
    tipo_reparacion: str
    descripcion: str | None = None
    orden: int = 0

class GaleriaUpdate(BaseModel):
    marca: str | None = None
    modelo: str | None = None
    anio: int | None = None
    tipo_reparacion: str | None = None
    descripcion: str | None = None
    activo: bool | None = None
    orden: int | None = None

class GaleriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    marca: str
    modelo: str
    anio: int | None
    tipo_reparacion: str
    descripcion: str | None
    imagen_antes: str
    imagen_despues: str
    activo: bool
    orden: int
    created_at: datetime
