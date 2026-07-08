import logging
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, clientes, config, documentos, estados, expedientes, galeria, imagenes, novedades, opiniones, resenas, solicitudes, usuarios, vehiculos
from app.api.routes.documentos import router_global as documentos_global_router
from app.core.config import settings

# Logs de notificaciones visibles en producción (Render no muestra INFO por defecto)
_log_handler = logging.StreamHandler(sys.stdout)
_log_handler.setFormatter(logging.Formatter("%(levelname)s:%(name)s: %(message)s"))
for _name in ("email", "notifications", "whatsapp"):
    _lg = logging.getLogger(_name)
    _lg.setLevel(logging.INFO)
    _lg.addHandler(_log_handler)
    _lg.propagate = False

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


def _migrar_columnas(engine):
    """Migracion ligera para SQLite: agrega columnas nuevas a tablas ya
    existentes (create_all no altera tablas). Idempotente."""
    from sqlalchemy import text
    if engine.dialect.name != "sqlite":
        return
    with engine.begin() as conn:
        cols = [r[1] for r in conn.execute(text("PRAGMA table_info(vehiculos)")).fetchall()]
        if "es_principal" not in cols:
            conn.execute(text("ALTER TABLE vehiculos ADD COLUMN es_principal BOOLEAN NOT NULL DEFAULT 0"))
            # Backfill: el vehiculo mas antiguo de cada cliente queda como principal.
            conn.execute(text(
                "UPDATE vehiculos SET es_principal = 1 WHERE id IN ("
                " SELECT v1.id FROM vehiculos v1 WHERE v1.created_at = ("
                "  SELECT MIN(v2.created_at) FROM vehiculos v2 WHERE v2.cliente_id = v1.cliente_id))"
            ))
    # Unicidad de patente para DBs ya existentes. Si hay duplicados, se omite.
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_vehiculos_patente ON vehiculos(patente)"))
    except Exception:
        logging.getLogger("app").warning("No se pudo crear el indice unico de patente (¿duplicados existentes?)")


@app.on_event("startup")
def inicializar_db():
    """Crea las tablas y carga los datos base (admin + estados + config)
    si la base está vacía. Idempotente: no pisa datos existentes."""
    from app.db.base import Base, engine
    Base.metadata.create_all(bind=engine)
    _migrar_columnas(engine)
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
