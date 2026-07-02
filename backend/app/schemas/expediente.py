import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.estado import EstadoOut
from app.schemas.usuario import UsuarioOut
from app.schemas.vehiculo import VehiculoOut


class ExpedienteCreate(BaseModel):
    vehiculo_id: uuid.UUID
    descripcion_inicial: str | None = None
    fecha_ingreso: date
    fecha_estimada_entrega: date | None = None
    presupuesto_estimado: Decimal | None = None
    es_siniestro: bool = False
    aseguradora: str | None = None
    numero_siniestro: str | None = None


class ExpedienteUpdate(BaseModel):
    descripcion_inicial: str | None = None
    fecha_estimada_entrega: date | None = None
    fecha_entrega_real: date | None = None
    presupuesto_estimado: Decimal | None = None
    aseguradora: str | None = None
    numero_siniestro: str | None = None
    activo: bool | None = None


class CambioEstadoRequest(BaseModel):
    """Body para el endpoint que avanza el expediente a un nuevo estado."""
    estado_id: uuid.UUID
    observacion: str | None = None


class ImagenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    url: str
    descripcion: str | None
    created_at: datetime


class HistorialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    estado: EstadoOut
    usuario: UsuarioOut
    observacion: str | None
    created_at: datetime
    imagenes: list[ImagenOut] = []


class ExpedienteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    numero_expediente: str
    vehiculo: VehiculoOut
    estado_actual: EstadoOut
    descripcion_inicial: str | None
    fecha_ingreso: date
    fecha_estimada_entrega: date | None
    fecha_entrega_real: date | None
    presupuesto_estimado: Decimal | None
    es_siniestro: bool
    aseguradora: str | None
    numero_siniestro: str | None
    activo: bool
    resena_completada: bool = False
    created_at: datetime


class ExpedienteDetalleOut(ExpedienteOut):
    """Version completa: incluye timeline, imagenes y novedades.
    Es lo que consume la pantalla de seguimiento del cliente."""
    historial: list[HistorialOut] = []
    imagenes: list[ImagenOut] = []
    novedades: list["NovedadOut"] = []


from app.schemas.novedad import NovedadOut  # noqa: E402
ExpedienteDetalleOut.model_rebuild()
