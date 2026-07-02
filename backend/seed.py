"""Script de seed: crea el usuario admin inicial y el catalogo de estados
por defecto. Correr una sola vez despues de aplicar las migraciones:

    python seed.py
"""
from app.core.security import hash_password
from app.db.base import SessionLocal
from app.models.estado import EstadoExpediente
from app.models.usuario import RolUsuario, Usuario

ESTADOS_POR_DEFECTO = [
    ("Ingreso", 1, "#64748B", False),
    ("Diagnostico", 2, "#0EA5E9", False),
    ("Desarme", 3, "#8B5CF6", False),
    ("Chapa", 4, "#F59E0B", False),
    ("Pintura", 5, "#EC4899", False),
    ("Armado", 6, "#6366F1", False),
    ("Pulido", 7, "#14B8A6", False),
    ("Control de calidad", 8, "#F97316", False),
    ("Listo para entrega", 9, "#22C55E", False),
    ("Entregado", 10, "#16A34A", True),
]

ADMIN_EMAIL = "admin@tutaller.com"
ADMIN_PASSWORD = "cambiar-esta-password"  # cambiar inmediatamente despues del primer login


def seed():
    db = SessionLocal()
    try:
        if not db.query(Usuario).filter(Usuario.email == ADMIN_EMAIL).first():
            admin = Usuario(
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                nombre="Admin",
                apellido="Taller",
                rol=RolUsuario.ADMIN,
            )
            db.add(admin)
            print(f"Usuario admin creado: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        else:
            print("El usuario admin ya existia, no se modifico")

        if db.query(EstadoExpediente).count() == 0:
            for nombre, orden, color, es_final in ESTADOS_POR_DEFECTO:
                db.add(EstadoExpediente(
                    nombre=nombre, orden=orden, color=color, es_estado_final=es_final
                ))
            print(f"{len(ESTADOS_POR_DEFECTO)} estados creados")
        else:
            print("Ya existian estados, no se modificaron")

        db.commit()
        seed_config(db)
        print("Seed completado correctamente.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()


CONFIG_POR_DEFECTO = {
    "nombre_taller": "AutoTrack Taller",
    "slogan": "Tu vehículo en las mejores manos",
    "descripcion_hero": "Seguí el avance de tu reparación en tiempo real, con fotos y actualizaciones de cada etapa.",
    "sobre_nosotros": "Somos un taller especializado en chapa, pintura y reparaciones por siniestro con más de 15 años de experiencia. Trabajamos con las principales aseguradoras y con clientes particulares, siempre con el mismo estándar de calidad y transparencia.",
    "anios_experiencia": "15+",
    "reparaciones_realizadas": "2.000+",
    "clientes_satisfechos": "98%",
    "tiempo_promedio_dias": "7",
    "telefono": "+54 11 0000-0000",
    "email": "info@tutaller.com",
    "direccion": "Av. Ejemplo 1234, Buenos Aires",
    "horarios": "Lun–Vie 8:00–18:00 · Sáb 9:00–13:00",
    "whatsapp": "5491100000000",
    "instagram": "",
    "facebook": "",
    "google_maps_embed": "",
    "google_maps_review_url": "",
    "google_place_id": "",   # Place ID de Google My Business  # URL de Google Maps para dejar reseña
}


def seed_config(db):
    from app.models.config import ConfiguracionSitio
    existentes = {r.clave for r in db.query(ConfiguracionSitio).all()}
    nuevas = 0
    for clave, valor in CONFIG_POR_DEFECTO.items():
        if clave not in existentes:
            db.add(ConfiguracionSitio(clave=clave, valor=valor))
            nuevas += 1
    if nuevas:
        db.commit()
        print(f"{nuevas} claves de configuración creadas")
    else:
        print("Configuración ya existía")
