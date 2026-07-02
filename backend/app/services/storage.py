"""Servicio de almacenamiento de imagenes.

MVP: guarda los archivos en disco local (carpeta `uploads/`) y devuelve
una URL servida por el propio backend. Para produccion, alcanza con
cambiar `guardar_imagen` para subir a Cloudinary y devolver esa URL;
el resto del sistema (modelo ImagenExpediente, endpoints) no cambia,
porque solo le importa el campo `url` final.
"""
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings

EXTENSIONES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}
TAMANIO_MAXIMO_MB = 10


def guardar_imagen(archivo: UploadFile, expediente_id: uuid.UUID) -> str:
    extension = Path(archivo.filename or "").suffix.lower()
    if extension not in EXTENSIONES_PERMITIDAS:
        raise ValueError(f"Formato no permitido. Usar: {', '.join(EXTENSIONES_PERMITIDAS)}")

    if settings.STORAGE_BACKEND == "cloudinary":
        # TODO: integrar Cloudinary cuando se configure CLOUDINARY_URL en .env
        # import cloudinary.uploader
        # resultado = cloudinary.uploader.upload(archivo.file)
        # return resultado["secure_url"]
        raise NotImplementedError("Configurar integracion con Cloudinary antes de usar este backend")

    carpeta = Path(settings.UPLOADS_DIR) / str(expediente_id)
    carpeta.mkdir(parents=True, exist_ok=True)

    nombre_archivo = f"{uuid.uuid4()}{extension}"
    destino = carpeta / nombre_archivo

    with destino.open("wb") as f:
        f.write(archivo.file.read())

    # Esta URL relativa la sirve FastAPI via StaticFiles montado en /uploads (ver main.py)
    return f"/uploads/{expediente_id}/{nombre_archivo}"


EXTENSIONES_DOCUMENTOS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".jpg", ".jpeg", ".png", ".webp",
}


def guardar_documento(archivo, expediente_id) -> tuple[str, str, int]:
    """Guarda un documento de expediente. Devuelve (url, extension, tamano_bytes)."""
    from pathlib import Path as _Path
    import uuid as _uuid
    extension = _Path(archivo.filename or "").suffix.lower()
    contenido = archivo.file.read()
    tamano = len(contenido)

    if settings.STORAGE_BACKEND == "cloudinary":
        raise NotImplementedError("Configurar Cloudinary")

    carpeta = _Path(settings.UPLOADS_DIR) / "documentos" / str(expediente_id)
    carpeta.mkdir(parents=True, exist_ok=True)
    nombre_archivo = f"{_uuid.uuid4()}{extension}"
    (carpeta / nombre_archivo).write_bytes(contenido)
    return f"/uploads/documentos/{expediente_id}/{nombre_archivo}", extension, tamano


def guardar_imagen_solicitud(archivo, solicitud_id) -> str:
    """Guarda una imagen adjunta a una solicitud de presupuesto."""
    extension = Path(archivo.filename or "").suffix.lower()
    if extension not in EXTENSIONES_PERMITIDAS:
        raise ValueError(f"Formato no permitido. Usar: {', '.join(EXTENSIONES_PERMITIDAS)}")

    if settings.STORAGE_BACKEND == "cloudinary":
        raise NotImplementedError("Configurar Cloudinary")

    carpeta = Path(settings.UPLOADS_DIR) / "solicitudes" / str(solicitud_id)
    carpeta.mkdir(parents=True, exist_ok=True)
    nombre_archivo = f"{uuid.uuid4()}{extension}"
    destino = carpeta / nombre_archivo
    with destino.open("wb") as f:
        f.write(archivo.file.read())
    return f"/uploads/solicitudes/{solicitud_id}/{nombre_archivo}"
