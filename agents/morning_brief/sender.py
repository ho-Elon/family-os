"""Send WhatsApp message to Han only, reusing Twilio credentials."""

import os

from twilio.rest import Client

MY_NUMBER = "+6586116668"


def send_to_han(message: str) -> str:
    """Send a WhatsApp message to Han's number only.

    Returns:
        Twilio message SID.
    """
    client = Client(
        os.environ["TWILIO_ACCOUNT_SID"],
        os.environ["TWILIO_AUTH_TOKEN"],
    )
    msg = client.messages.create(
        body=message,
        from_=os.environ["TWILIO_WHATSAPP_FROM"],
        to=f"whatsapp:{MY_NUMBER}",
    )
    return msg.sid
