from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, clientes, config, documentos, estados, expedientes, galeria, imagenes, novedades, opiniones, resenas, solicitudes, usuarios, vehiculos
from app.api.routes.documentos import router_global as documentos_global_router
from app.core.config import settings

app = FastAPI(
    title="Taller Tracker API",
    description="API para seguimiento online de reparaciones de chapa y pintura",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sirve las imagenes subidas localmente (solo aplica con STORAGE_BACKEND=local)
Path(settings.UPLOADS_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(clientes.router)
app.include_router(vehiculos.router)
app.include_router(estados.router)
app.include_router(expedientes.router)
app.include_router(novedades.router)
app.include_router(imagenes.router)
app.include_router(documentos.router)
app.include_router(documentos_global_router)
app.include_router(solicitudes.router)
app.include_router(galeria.router)
app.include_router(opiniones.router)
app.include_router(config.router)
app.include_router(resenas.router)


@app.on_event("startup")
def inicializar_db():
    """Crea las tablas y carga los datos base (admin + estados + config)
    si la base está vacía. Idempotente: no pisa datos existentes."""
    from app.db.base import Base, engine
    Base.metadata.create_all(bind=engine)
    from seed import seed
    seed()


@app.on_event("startup")
def limpiar_registros_huerfanos():
    """Integridad: elimina registros que quedaron apuntando a expedientes
    inexistentes (antes de habilitar el cascade) y galeria soft-deleted vieja."""
    from sqlalchemy import text
    from app.db.base import SessionLocal
    db = SessionLocal()
    try:
        db.execute(text("DELETE FROM documentos WHERE expediente_id NOT IN (SELECT id FROM expedientes)"))
        db.execute(text("DELETE FROM historial_fecha_entrega WHERE expediente_id NOT IN (SELECT id FROM expedientes)"))
        db.execute(text("DELETE FROM galeria_trabajos WHERE NOT activo"))
        db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# ── Frontend (SPA) ─────────────────────────────────────────────────────────
# Sirve el build del frontend. Debe ir al final para no tapar /api ni /uploads.
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def servir_spa(full_path: str):
        archivo = FRONTEND_DIST / full_path
        if full_path and archivo.is_file():
            return FileResponse(archivo)
        return FileResponse(FRONTEND_DIST / "index.html")
