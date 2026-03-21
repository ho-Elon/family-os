"""Send WhatsApp messages via Twilio."""

import os

from twilio.rest import Client


def send_whatsapp(message: str) -> list[str]:
    """Send a WhatsApp message to all configured family numbers.

    Returns:
        List of Twilio message SIDs.
    """
    client = Client(
        os.environ["TWILIO_ACCOUNT_SID"],
        os.environ["TWILIO_AUTH_TOKEN"],
    )
    from_number = os.environ["TWILIO_WHATSAPP_FROM"]  # e.g. "whatsapp:+14155238886"
    recipients = [
        "+6586116668",          # Hoelon
        # "+6581234567",        # Mimi — re-enable when ready
        # "+6589876543",        # Mahmah — re-enable when ready
    ]

    sids = []
    for number in recipients:
        number = number.strip()
        msg = client.messages.create(
            body=message,
            from_=from_number,
            to=f"whatsapp:{number}",
        )
        sids.append(msg.sid)

    return sids
