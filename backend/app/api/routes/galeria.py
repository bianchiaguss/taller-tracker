import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.api.deps import require_admin
from app.db.session import get_db
from app.models.galeria import GaleriaTrabajo
from app.models.usuario import Usuario
from app.schemas.galeria import GaleriaOut, GaleriaUpdate
from app.services.storage import guardar_imagen

router = APIRouter(prefix="/api/galeria", tags=["galeria"])

@router.get("", response_model=list[GaleriaOut])
def listar_galeria(db: Session = Depends(get_db)):
    return db.query(GaleriaTrabajo).filter(GaleriaTrabajo.activo == True).order_by(
        GaleriaTrabajo.orden, GaleriaTrabajo.created_at.desc()
    ).all()

@router.get("/admin", response_model=list[GaleriaOut])
def listar_galeria_admin(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    # Admin y publico deben mostrar exactamente los mismos trabajos existentes.
    return db.query(GaleriaTrabajo).filter(GaleriaTrabajo.activo == True).order_by(GaleriaTrabajo.orden).all()

@router.post("", response_model=GaleriaOut, status_code=status.HTTP_201_CREATED)
def crear_item_galeria(
    marca: str = Form(...),
    modelo: str = Form(...),
    tipo_reparacion: str = Form(...),
    anio: int | None = Form(None),
    descripcion: str | None = Form(None),
    orden: int = Form(0),
    imagen_antes: UploadFile = File(...),
    imagen_despues: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    import uuid as _uuid
    fake_id = _uuid.uuid4()
    try:
        url_antes = guardar_imagen(imagen_antes, fake_id)
        url_despues = guardar_imagen(imagen_despues, fake_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    item = GaleriaTrabajo(
        marca=marca, modelo=modelo, tipo_reparacion=tipo_reparacion,
        anio=anio, descripcion=descripcion, orden=orden,
        imagen_antes=url_antes, imagen_despues=url_despues,
    )
    db.add(item); db.commit(); db.refresh(item)
    return item

@router.put("/{item_id}", response_model=GaleriaOut)
def actualizar_item(
    item_id: uuid.UUID, data: GaleriaUpdate,
    db: Session = Depends(get_db), _: Usuario = Depends(require_admin),
):
    item = db.get(GaleriaTrabajo, item_id)
    if not item: raise HTTPException(404, "Item no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit(); db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_item(
    item_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)
):
    item = db.get(GaleriaTrabajo, item_id)
    if not item: raise HTTPException(404, "Item no encontrado")
    db.delete(item); db.commit()
