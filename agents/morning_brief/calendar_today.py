"""Fetch today's events, reusing credentials from whatsapp_briefing."""

import os
from datetime import datetime, timedelta, timezone

from agents.whatsapp_briefing.calendar_reader import (
    _get_credentials,
    _fetch_events,
    _parse_event,
)
from googleapiclient.discovery import build

SGT = timezone(timedelta(hours=8))


def get_today_events() -> dict[str, list[dict]]:
    """Return today's events grouped by calendar label."""
    creds = _get_credentials()
    service = build("calendar", "v3", credentials=creds)

    today = datetime.now(SGT).date()
    time_min = datetime(today.year, today.month, today.day, 0, 0, 0, tzinfo=SGT).isoformat()
    time_max = datetime(today.year, today.month, today.day, 23, 59, 59, tzinfo=SGT).isoformat()

    calendars = {
        "Personal": os.environ["GOOGLE_CALENDAR_ID_PERSONAL"],
        "Leng Family": os.environ["GOOGLE_CALENDAR_ID_FAMILY"],
    }

    events_by_calendar = {}
    for label, cal_id in calendars.items():
        raw_events = _fetch_events(service, cal_id, time_min, time_max)
        events_by_calendar[label] = [_parse_event(e) for e in raw_events]

    return events_by_calendar
