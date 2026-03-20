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
    print("[1/5] Fetching today's calendar events...")
    events = get_today_events()
    print(f"  -> Got events: { {k: len(v) for k, v in events.items()} }")

    print("[2/5] Fetching overnight FX moves...")
    fx = get_fx_moves()
    print(f"  -> Got {len(fx)} pairs: {fx}")

    print("[3/5] Fetching Singapore weather...")
    weather = get_singapore_weather()
    print(f"  -> Weather: {weather}")

    print("[4/5] Formatting message...")
    message = format_morning_brief(events, fx, weather)
    print(f"  -> Message length: {len(message)} chars")
    print("--- MESSAGE PREVIEW ---")
    print(message)
    print("--- END PREVIEW ---")

    print("[5/5] Sending via WhatsApp...")
    sid = send_to_han(message)
    print(f"  -> Sent! SID: {sid}")

    return {"message": message, "sid": sid}


def send_thursday_reminder() -> dict:
    """Send the Thursday volleyball reminder."""
    message = "Jue has volleyball today. Billy departs 6:30am."
    sid = send_to_han(message)
    return {"message": message, "sid": sid}
