"""
Ejecutar UNA SOLA VEZ desde la carpeta backend:
    python fix_db.py

Agrega las columnas y tablas nuevas directamente al archivo taller.db
sin necesitar Alembic ni migración manual.
"""
import os
import sys

# Leer la URL de la base de datos desde .env
db_url = "sqlite:///./taller.db"  # valor por defecto
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    for line in open(env_path):
        line = line.strip()
        if line.startswith("DATABASE_URL="):
            db_url = line.split("=", 1)[1].strip()
            break

# Solo funciona con SQLite
if not db_url.startswith("sqlite"):
    print("Esta base de datos no es SQLite. Usá 'alembic upgrade head' en su lugar.")
    sys.exit(0)

# Extraer la ruta del archivo .db
db_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
if db_path.startswith("./"):
    db_path = os.path.join(os.path.dirname(__file__), db_path[2:])

print(f"Base de datos: {db_path}")

if not os.path.exists(db_path):
    print("ERROR: No se encontró el archivo de base de datos.")
    print(f"Ruta buscada: {db_path}")
    sys.exit(1)

import sqlite3
conn = sqlite3.connect(db_path)
cur = conn.cursor()

fixes = []

# 1. Agregar notif_email a clientes
try:
    cur.execute("ALTER TABLE clientes ADD COLUMN notif_email BOOLEAN NOT NULL DEFAULT 1")
    fixes.append("✓ clientes.notif_email agregada")
except sqlite3.OperationalError as e:
    fixes.append(f"  clientes.notif_email: ya existe")

# 2. Agregar notif_whatsapp a clientes
try:
    cur.execute("ALTER TABLE clientes ADD COLUMN notif_whatsapp BOOLEAN NOT NULL DEFAULT 0")
    fixes.append("✓ clientes.notif_whatsapp agregada")
except sqlite3.OperationalError as e:
    fixes.append(f"  clientes.notif_whatsapp: ya existe")

# 3. Agregar token_resena a expedientes (si no existe)
try:
    cur.execute("ALTER TABLE expedientes ADD COLUMN token_resena VARCHAR(36)")
    fixes.append("✓ expedientes.token_resena agregada")
except sqlite3.OperationalError:
    fixes.append(f"  expedientes.token_resena: ya existe")

# 4. Agregar resena_completada a expedientes (si no existe)
try:
    cur.execute("ALTER TABLE expedientes ADD COLUMN resena_completada BOOLEAN NOT NULL DEFAULT 0")
    fixes.append("✓ expedientes.resena_completada agregada")
except sqlite3.OperationalError:
    fixes.append(f"  expedientes.resena_completada: ya existe")

# 5. Agregar respuesta a solicitudes_presupuesto (si no existe)
try:
    cur.execute("ALTER TABLE solicitudes_presupuesto ADD COLUMN respuesta TEXT")
    fixes.append("✓ solicitudes_presupuesto.respuesta agregada")
except sqlite3.OperationalError:
    fixes.append(f"  solicitudes_presupuesto.respuesta: ya existe")

# 6. Agregar respuesta_at a solicitudes_presupuesto (si no existe)
try:
    cur.execute("ALTER TABLE solicitudes_presupuesto ADD COLUMN respuesta_at TIMESTAMP")
    fixes.append("✓ solicitudes_presupuesto.respuesta_at agregada")
except sqlite3.OperationalError:
    fixes.append(f"  solicitudes_presupuesto.respuesta_at: ya existe")

# 7. Crear tabla historial_fecha_entrega (si no existe)
cur.execute("""
    CREATE TABLE IF NOT EXISTS historial_fecha_entrega (
        id TEXT PRIMARY KEY NOT NULL,
        expediente_id TEXT NOT NULL REFERENCES expedientes(id) ON DELETE CASCADE,
        usuario_id TEXT NOT NULL REFERENCES usuarios(id),
        fecha_anterior DATE,
        fecha_nueva DATE,
        motivo TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
fixes.append("✓ historial_fecha_entrega OK")

conn.commit()
conn.close()

print("\nResultado:")
for f in fixes:
    print(f"  {f}")
print("\n¡Listo! Ahora reiniciá el backend con: uvicorn app.main:app --reload")
