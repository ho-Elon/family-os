"""Format calendar events into a warm WhatsApp message."""

from datetime import datetime, timedelta, timezone

SGT = timezone(timedelta(hours=8))


def format_briefing(events_by_calendar: dict[str, list[dict]]) -> str:
    """Format grouped events into a friendly WhatsApp message.

    Args:
        events_by_calendar: {"Personal": [...], "Leng Family": [...]}

    Returns:
        Formatted message string.
    """
    tomorrow = (datetime.now(SGT) + timedelta(days=1)).strftime("%A, %B %d").replace(" 0", " ")

    lines = [
        f"Good evening, Lengs! Here's what's coming up tomorrow ({tomorrow}):",
        "",
    ]

    total_events = sum(len(evts) for evts in events_by_calendar.values())

    if total_events == 0:
        lines.append("Nothing on the calendar — enjoy a free day together!")
    else:
        for label, events in events_by_calendar.items():
            if not events:
                continue
            lines.append(f"*{label}*")
            for event in events:
                location = f" @ {event['location']}" if event.get("location") else ""
                lines.append(f"  • {event['time']} — {event['title']}{location}")
            lines.append("")

    lines.append("Sleep well! 🌙")

    return "\n".join(lines)
