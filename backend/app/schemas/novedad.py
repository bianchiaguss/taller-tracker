import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NovedadCreate(BaseModel):
    titulo: str
    mensaje: str


class NovedadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    titulo: str
    mensaje: str
    created_at: datetime
