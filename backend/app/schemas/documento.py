import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.usuario import UsuarioOut


class VehiculoMinimo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    patente: str
    marca: str
    modelo: str


class ExpedienteMinimo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    numero_expediente: str
    vehiculo: VehiculoMinimo | None = None


class DocumentoCreate(BaseModel):
    nombre: str
    tipo: str = "otro"
    visible_cliente: bool = False


class DocumentoUpdate(BaseModel):
    nombre: str | None = None
    visible_cliente: bool | None = None


class DocumentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    nombre: str
    tipo: str
    url: str
    extension: str | None
    tamano_bytes: int | None
    visible_cliente: bool
    usuario: UsuarioOut
    expediente: ExpedienteMinimo | None = None
    created_at: datetime
