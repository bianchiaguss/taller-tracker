"""Configuracion del engine de SQLAlchemy y la clase Base declarativa."""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# SQLite no aplica ON DELETE CASCADE salvo que se habiliten las foreign keys
# por conexion. Sin esto, borrar un expediente dejaba documentos/historial huerfanos.
if engine.dialect.name == "sqlite":
    @event.listens_for(engine, "connect")
    def _sqlite_fk_pragma(dbapi_conn, _connection_record):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Clase base de la que heredan todos los modelos."""
    pass
