import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.config import ConfiguracionSitio
from app.models.expediente import Expediente
from app.models.opinion import Opinion
from app.schemas.resena import ResenaPublicCreate, ResenaInfoOut

router = APIRouter(prefix="/api/resenas", tags=["resenas"])


@router.get("/public/{token}", response_model=ResenaInfoOut)
def get_info_resena(token: str, db: Session = Depends(get_db)):
    """Sin autenticación: el cliente llega desde el link del email."""
    exp = db.query(Expediente).filter(Expediente.token_resena == token).first()
    if not exp:
        raise HTTPException(404, "Link inválido")
    if exp.resena_completada:
        raise HTTPException(410, "Esta reseña ya fue completada")
    config = {r.clave: r.valor for r in db.query(ConfiguracionSitio).all()}
    return ResenaInfoOut(
        nombre_cliente=exp.vehiculo.cliente.usuario.nombre,
        vehiculo=f"{exp.vehiculo.marca} {exp.vehiculo.modelo}",
        numero_expediente=exp.numero_expediente,
        nombre_taller=config.get("nombre_taller", "TallerTrack"),
    )


@router.post("/public/{token}", status_code=201)
def submit_resena(token: str, data: ResenaPublicCreate, db: Session = Depends(get_db)):
    if not (1 <= data.calificacion <= 5):
        raise HTTPException(400, "La calificación debe ser entre 1 y 5")
    exp = db.query(Expediente).filter(Expediente.token_resena == token).first()
    if not exp:
        raise HTTPException(404, "Link inválido")
    if exp.resena_completada:
        raise HTTPException(410, "Esta reseña ya fue completada")

    nombre = exp.vehiculo.cliente.usuario.nombre_completo
    op = Opinion(
        nombre=nombre,
        fecha=date.today(),
        calificacion=data.calificacion,
        comentario=data.comentario,
        activo=True,
        fuente="cliente",
    )
    db.add(op)
    exp.resena_completada = True
    db.commit()
    return {"ok": True}
