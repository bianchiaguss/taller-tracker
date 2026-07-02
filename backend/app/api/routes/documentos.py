import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api.deps import get_current_usuario, require_admin
from app.db.session import get_db
from app.models.documento import Documento
from app.models.expediente import Expediente
from app.models.usuario import RolUsuario, Usuario
from app.schemas.documento import DocumentoOut, DocumentoUpdate
from app.services.storage import guardar_documento
from app.services.events import EventBus

router = APIRouter(prefix="/api/expedientes/{expediente_id}/documentos", tags=["documentos"])

@router.get("", response_model=list[DocumentoOut])
def listar_documentos(
    expediente_id: uuid.UUID,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(get_current_usuario),
):
    from sqlalchemy.orm import joinedload, contains_eager
    from app.models.expediente import Expediente as ExpModel
    from app.models.vehiculo import Vehiculo as VehModel
    query = db.query(Documento).options(
        joinedload(Documento.expediente).joinedload(ExpModel.vehiculo),
        joinedload(Documento.usuario),
    ).filter(Documento.expediente_id == expediente_id)
    if actual.rol == RolUsuario.CLIENTE:
        query = query.filter(Documento.visible_cliente == True)
    return query.order_by(Documento.created_at.desc()).all()

@router.post("", response_model=DocumentoOut, status_code=status.HTTP_201_CREATED)
def subir_documento(
    expediente_id: uuid.UUID,
    archivo: UploadFile = File(...),
    nombre: str = Form(...),
    tipo: str = Form("otro"),
    visible_cliente: bool = Form(False),
    db: Session = Depends(get_db),
    actual: Usuario = Depends(require_admin),
):
    if not db.get(Expediente, expediente_id):
        raise HTTPException(404, "Expediente no encontrado")
    try:
        url, extension, tamano = guardar_documento(archivo, expediente_id)
    except Exception as e:
        raise HTTPException(400, str(e))
    doc = Documento(
        expediente_id=expediente_id, usuario_id=actual.id,
        nombre=nombre, tipo=tipo, url=url,
        extension=extension, tamano_bytes=tamano,
        visible_cliente=visible_cliente,
    )
    db.add(doc); db.commit()
    from sqlalchemy.orm import joinedload as _jl
    doc = db.query(Documento).options(_jl(Documento.expediente), _jl(Documento.usuario)).filter(Documento.id == doc.id).first()
    if visible_cliente:
        exp_obj = db.get(Expediente, expediente_id)
        EventBus.emit("nuevo_documento", expediente=exp_obj, actor=actual, extra={"nombre_documento": nombre, "tipo": tipo})
    return doc

@router.patch("/{doc_id}", response_model=DocumentoOut)
def actualizar_documento(
    expediente_id: uuid.UUID,
    doc_id: uuid.UUID,
    data: DocumentoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    doc = db.get(Documento, doc_id)
    if not doc: raise HTTPException(404, "Documento no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(doc, k, v)
    db.commit(); db.refresh(doc)
    return doc

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_documento(
    expediente_id: uuid.UUID, doc_id: uuid.UUID,
    db: Session = Depends(get_db), _: Usuario = Depends(require_admin),
):
    doc = db.get(Documento, doc_id)
    if not doc: raise HTTPException(404, "Documento no encontrado")
    db.delete(doc); db.commit()


# ─── Router adicional para listar TODOS los documentos (admin) ───────────────
from fastapi import APIRouter as _APIRouter

router_global = _APIRouter(prefix="/api/documentos", tags=["documentos"])


@router_global.get("", response_model=list[DocumentoOut])
def listar_todos_documentos(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
    expediente_id: uuid.UUID | None = None,
    tipo: str | None = None,
):
    """Admin: lista todos los documentos con filtros opcionales."""
    from sqlalchemy.orm import joinedload, contains_eager
    from app.models.expediente import Expediente as ExpModel
    from app.models.vehiculo import Vehiculo as VehModel
    query = db.query(Documento).options(
        joinedload(Documento.expediente).joinedload(ExpModel.vehiculo),
        joinedload(Documento.usuario),
    )
    if expediente_id:
        query = query.filter(Documento.expediente_id == expediente_id)
    if tipo:
        query = query.filter(Documento.tipo == tipo)
    return query.order_by(Documento.created_at.desc()).all()


@router_global.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_documento_global(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    """Admin: elimina un documento por id (sirve tambien para huerfanos)."""
    doc = db.get(Documento, doc_id)
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    db.delete(doc); db.commit()
