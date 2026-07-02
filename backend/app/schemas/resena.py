from pydantic import BaseModel

class ResenaPublicCreate(BaseModel):
    calificacion: int   # 1-5
    comentario: str

class ResenaInfoOut(BaseModel):
    nombre_cliente: str
    vehiculo: str
    numero_expediente: str
    nombre_taller: str
