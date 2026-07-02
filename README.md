# Taller Tracker — Backend (MVP)

API para la plataforma de seguimiento online de reparaciones de chapa y pintura.

## Stack

- **FastAPI** (Python 3.12) + **SQLAlchemy 2.0** + **Alembic**
- **PostgreSQL** como base de datos
- **JWT** (python-jose) para autenticacion, **bcrypt** para hashing de passwords
- Almacenamiento de imagenes: local en `uploads/` (preparado para migrar a Cloudinary con un solo cambio en `app/services/storage.py`)
- Notificaciones por email: log local en desarrollo, listo para Resend en produccion (`app/services/email.py`)

## Como levantar el entorno local

1. Copiar el archivo de variables de entorno:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Editar `backend/.env` y poner un `SECRET_KEY` propio (cualquier string largo y aleatorio).

2. Levantar la base de datos y el backend:
   ```bash
   docker compose up -d
   ```

3. Aplicar las migraciones (la primera vez hay que generarlas, porque se generan
   contra una base de datos real, no se incluyen pre-armadas):
   ```bash
   docker compose exec backend alembic revision --autogenerate -m "inicial"
   docker compose exec backend alembic upgrade head
   ```

4. Crear el usuario admin inicial y el catalogo de estados por defecto:
   ```bash
   docker compose exec backend python seed.py
   ```
   Esto crea `admin@tutaller.com` / `cambiar-esta-password` — cambiar el email/password
   en `seed.py` antes de correrlo en produccion, o crear un nuevo admin desde el codigo
   y desactivar este despues.

5. La API queda disponible en `http://localhost:8000`. Documentacion interactiva
   (Swagger) en `http://localhost:8000/docs`.

## Estructura del proyecto

```
backend/
├── app/
│   ├── core/        # configuracion (settings) y seguridad (JWT, hashing)
│   ├── db/          # engine, sesion de SQLAlchemy
│   ├── models/       # modelos de SQLAlchemy (las tablas)
│   ├── schemas/      # schemas de Pydantic (validacion de entrada/salida de la API)
│   ├── api/
│   │   ├── deps.py        # dependencias de auth (usuario actual, requiere-admin)
│   │   └── routes/        # un router por recurso
│   ├── services/     # email.py (notificaciones) y storage.py (imagenes)
│   └── main.py       # arma la app y registra los routers
├── alembic/          # migraciones de base de datos
├── seed.py           # datos iniciales (admin + estados por defecto)
└── requirements.txt
```

## Modelo de datos

- **Usuario** — cuenta de acceso (`admin` o `cliente`)
- **Cliente** — perfil del cliente, 1 a 1 con Usuario
- **Vehiculo** — pertenece a un Cliente
- **EstadoExpediente** — catalogo configurable de etapas (Ingreso, Chapa, Pintura, etc.)
- **Expediente** — el nucleo: une Vehiculo + estado actual + fechas + datos de seguro
- **HistorialExpediente** — el timeline: un registro por cada cambio de estado
- **ImagenExpediente** — fotos, asociadas a un expediente y opcionalmente a una etapa
- **Novedad** — comentarios/actualizaciones en lenguaje natural para el cliente

## Endpoints principales

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/auth/login` | Login, devuelve JWT |
| GET | `/api/auth/me` | Usuario autenticado actual |
| POST | `/api/clientes` | Admin crea cliente (+ su usuario) |
| POST | `/api/vehiculos` | Admin crea vehiculo |
| POST | `/api/expedientes` | Admin abre expediente (queda en el primer estado del catalogo) |
| PATCH | `/api/expedientes/{id}/estado` | **El endpoint clave**: cambia de etapa, registra en el timeline y dispara el email |
| GET | `/api/expedientes/{id}` | Detalle completo con timeline, imagenes y novedades |
| POST | `/api/expedientes/{id}/imagenes` | Sube una foto (multipart/form-data) |
| POST | `/api/expedientes/{id}/novedades` | Publica una novedad para el cliente |
| GET/POST/PUT/DELETE | `/api/estados` | Admin gestiona el catalogo de etapas |

Lista completa e interactiva en `/docs` una vez levantado el servidor.

## Control de acceso

- Un usuario con rol `cliente` solo puede ver sus propios vehiculos y expedientes
  (filtrado automaticamente en cada endpoint de lectura).
- Todas las acciones de escritura (crear/editar/cambiar estado) requieren rol `admin`.

## Que falta para produccion

- [ ] Generar y revisar la migracion inicial de Alembic (paso 3 de arriba)
- [ ] Configurar `RESEND_API_KEY` en `.env` para que los emails salgan de verdad
- [ ] Configurar `STORAGE_BACKEND=cloudinary` + credenciales cuando se quiera dejar de
      guardar imagenes en disco local (necesario antes de deployar a Railway/Render,
      porque el filesystem ahi no es persistente entre deploys)
- [ ] Cambiar la contraseña del admin generado por `seed.py`
- [ ] Definir politica de CORS final con el dominio real del frontend en produccion
