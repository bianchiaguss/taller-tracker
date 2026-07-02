import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import require_admin
from app.db.session import get_db
from app.models.opinion import Opinion
from app.models.usuario import Usuario
from app.schemas.opinion import OpinionCreate, OpinionOut, OpinionUpdate

router = APIRouter(prefix="/api/opiniones", tags=["opiniones"])


@router.get("", response_model=list[OpinionOut])
def listar_opiniones(db: Session = Depends(get_db)):
    return db.query(Opinion).filter(Opinion.activo == True).order_by(Opinion.fecha.desc()).all()


@router.get("/admin", response_model=list[OpinionOut])
def listar_opiniones_admin(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return db.query(Opinion).order_by(Opinion.fecha.desc()).all()


@router.get("/google")
def obtener_opiniones_google(db: Session = Depends(get_db)):
    """Obtiene reseñas de Google Maps via Places API. Requiere GOOGLE_PLACES_API_KEY y google_place_id en config."""
    from app.core.config import settings
    from app.models.config import ConfiguracionSitio

    api_key = settings.GOOGLE_PLACES_API_KEY
    place_id_row = db.query(ConfiguracionSitio).filter(ConfiguracionSitio.clave == "google_place_id").first()
    place_id = place_id_row.valor if place_id_row else ""

    if not api_key or not place_id:
        return {"ok": False, "reviews": [], "rating": None, "total": None,
                "mensaje": "Configurar GOOGLE_PLACES_API_KEY y google_place_id para activar esta función"}

    import httpx
    try:
        resp = httpx.get(
            "https://maps.googleapis.com/maps/api/place/details/json",
            params={
                "place_id": place_id,
                "fields": "name,rating,user_ratings_total,reviews",
                "language": "es",
                "reviews_sort": "newest",
                "key": api_key,
            },
            timeout=8,
        )
        data = resp.json()
        result = data.get("result", {})
        reviews = [
            {
                "nombre": r.get("author_name"),
                "calificacion": r.get("rating"),
                "comentario": r.get("text", ""),
                "fecha_relativa": r.get("relative_time_description", ""),
                "foto_perfil": r.get("profile_photo_url"),
                "fuente": "google",
            }
            for r in result.get("reviews", [])
        ]
        return {
            "ok": True,
            "reviews": reviews,
            "rating": result.get("rating"),
            "total": result.get("user_ratings_total"),
        }
    except Exception as e:
        return {"ok": False, "reviews": [], "rating": None, "total": None, "mensaje": str(e)}


@router.post("", response_model=OpinionOut, status_code=status.HTTP_201_CREATED)
def crear_opinion(data: OpinionCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    op = Opinion(**data.model_dump())
    db.add(op); db.commit(); db.refresh(op)
    return op


@router.put("/{op_id}", response_model=OpinionOut)
def actualizar_opinion(op_id: uuid.UUID, data: OpinionUpdate, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    op = db.get(Opinion, op_id)
    if not op: raise HTTPException(404, "Opinión no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(op, k, v)
    db.commit(); db.refresh(op)
    return op


@router.delete("/{op_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_opinion(op_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    op = db.get(Opinion, op_id)
    if not op: raise HTTPException(404, "Opinión no encontrada")
    op.activo = False; db.commit()
