from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import require_admin
from app.db.session import get_db
from app.models.config import ConfiguracionSitio
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/config", tags=["config"])

@router.get("", response_model=dict[str, str])
def get_config(db: Session = Depends(get_db)):
    """Endpoint público — lo consume la landing page sin autenticación."""
    return {r.clave: r.valor for r in db.query(ConfiguracionSitio).all()}

@router.put("", response_model=dict[str, str])
def update_config(
    data: dict[str, str],
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    for clave, valor in data.items():
        item = db.query(ConfiguracionSitio).filter(ConfiguracionSitio.clave == clave).first()
        if item:
            item.valor = valor
        else:
            db.add(ConfiguracionSitio(clave=clave, valor=valor))
    db.commit()
    return data
