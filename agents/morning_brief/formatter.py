"""Format the morning brief into a clean WhatsApp message."""

from datetime import datetime, timedelta, timezone

SGT = timezone(timedelta(hours=8))


def format_morning_brief(
    events: dict[str, list[dict]],
    fx: list[dict],
    weather: dict,
) -> str:
    """Format all morning brief data into a single message."""
    today = datetime.now(SGT).strftime("%A, %B %d").replace(" 0", " ")

    lines = [f"Good morning, Hoelon. Here's your brief for {today}.", ""]

    # --- Markets overnight ---
    lines.append("*Markets Overnight*")
    if fx:
        for m in fx:
            if m["price"] is None:
                lines.append(f"  {m['pair']}: unavailable")
            else:
                arrow = "+" if (m["change_pct"] or 0) >= 0 else ""
                lines.append(f"  {m['pair']}: {m['price']}  ({arrow}{m['change_pct']}%)")
    else:
        lines.append("  FX data unavailable")
    lines.append("")

    # --- Weather ---
    lines.append("*Singapore Weather*")
    if weather.get("high") is not None:
        lines.append(
            f"  {weather['description']} — {weather['low']}°C to {weather['high']}°C, "
            f"{weather['rain_chance']}% chance of rain"
        )
    else:
        lines.append(f"  {weather['description']}")
    lines.append("")

    # --- My schedule ---
    personal = events.get("Personal", [])
    lines.append("*Your Schedule*")
    if personal:
        for e in personal:
            loc = f" @ {e['location']}" if e.get("location") else ""
            lines.append(f"  • {e['time']} — {e['title']}{loc}")
    else:
        lines.append("  Nothing scheduled — open day")
    lines.append("")

    # --- Family schedule ---
    family = events.get("Leng Family", [])
    lines.append("*Family Schedule*")
    if family:
        for e in family:
            loc = f" @ {e['location']}" if e.get("location") else ""
            lines.append(f"  • {e['time']} — {e['title']}{loc}")
    else:
        lines.append("  Nothing on the family calendar")
    lines.append("")

    # --- Focus prompt ---
    total = len(personal) + len(family)
    if total == 0:
        lines.append("_Clear calendar today. Use it well._")
    elif total <= 3:
        lines.append("_Light day. Stay sharp, stay present._")
    else:
        lines.append("_Busy day ahead. Prioritise what matters most._")

    return "\n".join(lines)
