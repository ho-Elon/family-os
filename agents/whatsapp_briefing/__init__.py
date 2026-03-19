"""Nightly Family WhatsApp Briefing Agent.

Reads tomorrow's events from Google Calendar and sends a
friendly summary to the family WhatsApp group via Twilio.
"""

from .calendar_reader import get_tomorrow_events
from .message_formatter import format_briefing
from .sender import send_whatsapp


def run() -> dict:
    """Execute the full briefing pipeline.

    Returns:
        Dict with message text and Twilio SIDs.
    """
    events = get_tomorrow_events()
    message = format_briefing(events)
    sids = send_whatsapp(message)
    return {"message": message, "sids": sids}
