"""Personal 7am Morning Brief Agent.

Reads today's calendar, overnight FX moves, and Singapore weather,
then sends a clean personal briefing to Han via WhatsApp.
"""

from .calendar_today import get_today_events
from .markets import get_fx_moves
from .weather import get_singapore_weather
from .formatter import format_morning_brief
from .sender import send_to_han


def run() -> dict:
    """Execute the full morning brief pipeline."""
    events = get_today_events()
    fx = get_fx_moves()
    weather = get_singapore_weather()
    message = format_morning_brief(events, fx, weather)
    sid = send_to_han(message)
    return {"message": message, "sid": sid}


def send_thursday_reminder() -> dict:
    """Send the Thursday volleyball reminder."""
    message = "Jue has volleyball today. Billy departs 6:30am."
    sid = send_to_han(message)
    return {"message": message, "sid": sid}
