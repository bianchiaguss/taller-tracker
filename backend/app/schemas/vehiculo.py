import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class VehiculoBase(BaseModel):
    marca: str
    modelo: str
    anio: int | None = None
    patente: str
    color: str | None = None
    vin: str | None = None
    kilometraje: int | None = None


class VehiculoCreate(VehiculoBase):
    cliente_id: uuid.UUID


class VehiculoUpdate(BaseModel):
    marca: str | None = None
    modelo: str | None = None
    anio: int | None = None
    patente: str | None = None
    color: str | None = None
    vin: str | None = None
    kilometraje: int | None = None


class VehiculoOut(VehiculoBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    cliente_id: uuid.UUID
    created_at: datetime
