from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuracion central de la aplicacion, leida desde variables de entorno."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Base de datos
    DATABASE_URL: str = "postgresql://taller_user:taller_pass@localhost:5432/taller_db"

    # Seguridad / JWT
    SECRET_KEY: str = "dev-secret-key-cambiar-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas, pensado para la jornada del taller

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Almacenamiento de imagenes
    STORAGE_BACKEND: str = "local"  # "local" o "cloudinary"
    UPLOADS_DIR: str = "uploads"
    CLOUDINARY_URL: str | None = None

    # Email
    RESEND_API_KEY: str | None = None
    EMAIL_FROM: str = "no-responder@tutaller.com"

    # Google Places (para mostrar reseñas automáticamente)
    GOOGLE_PLACES_API_KEY: str | None = None

    # WhatsApp (Evolution API o Meta Cloud API)
    WHATSAPP_BACKEND: str | None = None   # "evolution" o "meta"
    WHATSAPP_API_URL: str | None = None
    WHATSAPP_API_KEY: str | None = None
    WHATSAPP_INSTANCE: str | None = None  # solo Evolution
    WHATSAPP_PHONE_ID: str | None = None  # solo Meta


settings = Settings()
