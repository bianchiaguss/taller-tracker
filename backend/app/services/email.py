"""Servicio de notificaciones por email.

MVP: si no hay RESEND_API_KEY configurada, solo loguea el envio por
consola (util para desarrollo, no rompe nada sin credenciales reales).
Cuando se configure la API key, este modulo es el unico lugar que hay
que tocar para que los emails empiecen a salir de verdad.
"""
import logging

from app.core.config import settings

logger = logging.getLogger("email")


def _enviar(destinatario: str, asunto: str, cuerpo_html: str) -> None:
    if not settings.RESEND_API_KEY:
        logger.info("[EMAIL SIMULADO] Para: %s | Asunto: %s\n%s", destinatario, asunto, cuerpo_html)
        return

    import httpx

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            json={
                "from": settings.EMAIL_FROM,
                "to": [destinatario],
                "subject": asunto,
                "html": cuerpo_html,
            },
            timeout=10,
        )
        response.raise_for_status()
    except httpx.HTTPError:
        # La solicitud ya fue guardada. Un proveedor de correo caido no debe
        # transformar una operacion exitosa en un error 500 para el usuario.
        logger.exception(
            "No se pudo enviar el email a %s con asunto %s",
            destinatario,
            asunto,
        )


def notificar_cambio_estado(
    email_destino: str, nombre_cliente: str, numero_expediente: str, nuevo_estado: str
) -> None:
    asunto = f"Tu vehiculo avanzo de etapa - {numero_expediente}"
    cuerpo = f"""
    <p>Hola {nombre_cliente},</p>
    <p>Tu expediente <strong>{numero_expediente}</strong> avanzo a la etapa:
    <strong>{nuevo_estado}</strong>.</p>
    <p>Podes ver el detalle completo y las fotos ingresando a la plataforma.</p>
    """
    _enviar(email_destino, asunto, cuerpo)


def notificar_nueva_novedad(
    email_destino: str, nombre_cliente: str, numero_expediente: str, titulo_novedad: str
) -> None:
    asunto = f"Nueva novedad en tu expediente - {numero_expediente}"
    cuerpo = f"""
    <p>Hola {nombre_cliente},</p>
    <p>Hay una nueva novedad en tu expediente <strong>{numero_expediente}</strong>:</p>
    <p><strong>{titulo_novedad}</strong></p>
    <p>Ingresa a la plataforma para ver el detalle completo.</p>
    """
    _enviar(email_destino, asunto, cuerpo)


def notificar_nueva_solicitud(
    email_cliente: str, nombre: str, marca: str, modelo: str
) -> None:
    asunto = f"Nueva solicitud de presupuesto recibida — {marca} {modelo}"
    cuerpo = f"""
    <p>Hola {nombre},</p>
    <p>Recibimos tu solicitud de presupuesto para tu <strong>{marca} {modelo}</strong>.</p>
    <p>Te contactaremos a la brevedad para coordinar la visita y evaluación.</p>
    """
    _enviar(email_cliente, asunto, cuerpo)


def notificar_solicitud_resena(
    email_destino: str, nombre_cliente: str, numero_expediente: str,
    vehiculo: str, token: str, frontend_url: str
) -> None:
    link = f"{frontend_url}/resena/{token}"
    asunto = f"¿Cómo fue tu experiencia? — {numero_expediente}"
    cuerpo = f"""
    <p>Hola {nombre_cliente},</p>
    <p>Tu <strong>{vehiculo}</strong> (expediente {numero_expediente}) ya fue entregado.</p>
    <p>¿Podés contarnos cómo fue tu experiencia? Solo te lleva un minuto:</p>
    <p><a href="{link}" style="background:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
    Calificar mi experiencia</a></p>
    <p>Este link es personal y de un solo uso. ¡Gracias por confiar en nosotros!</p>
    """
    _enviar(email_destino, asunto, cuerpo)


def notificar_respuesta_presupuesto(
    email_destino: str, nombre: str, marca: str, modelo: str, respuesta: str
) -> None:
    asunto = f"Respuesta a tu solicitud de presupuesto — {marca} {modelo}"
    cuerpo = f"""
    <p>Hola {nombre},</p>
    <p>El taller respondió a tu solicitud de presupuesto para tu <strong>{marca} {modelo}</strong>:</p>
    <blockquote style="border-left:3px solid #2563EB;padding-left:16px;color:#374151;">{respuesta}</blockquote>
    <p>Si tenés dudas, no dudes en contactarnos.</p>
    """
    _enviar(email_destino, asunto, cuerpo)
