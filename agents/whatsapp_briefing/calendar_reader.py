"""Fetch tomorrow's events from Google Calendar using OAuth2 refresh token."""

import os
from datetime import datetime, timedelta, timezone

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SGT = timezone(timedelta(hours=8))

SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]


TOKEN_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "token.json")


def _get_credentials() -> Credentials:
    """Load credentials from token.json if available, else fall back to env vars."""
    creds = None

    # Try token.json first (created by authorize_google.py)
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    # Fall back to env vars (for Vercel / production)
    if creds is None:
        creds = Credentials(
            token=None,
            refresh_token=os.environ["GOOGLE_REFRESH_TOKEN"],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.environ["GOOGLE_CLIENT_ID"],
            client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
            scopes=SCOPES,
        )

    # Refresh if expired or no access token yet
    if not creds.valid:
        creds.refresh(Request())
        # Update token.json with refreshed credentials
        if os.path.exists(os.path.dirname(TOKEN_FILE)):
            with open(TOKEN_FILE, "w") as f:
                f.write(creds.to_json())

    return creds


def _fetch_events(service, calendar_id: str, time_min: str, time_max: str) -> list[dict]:
    """Fetch events from a single calendar within the given time window."""
    result = (
        service.events()
        .list(
            calendarId=calendar_id,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    return result.get("items", [])


def _parse_event(event: dict) -> dict:
    """Extract relevant fields from a calendar event."""
    start = event["start"]
    # All-day events use 'date', timed events use 'dateTime'
    if "dateTime" in start:
        dt = datetime.fromisoformat(start["dateTime"])
        time_str = dt.strftime("%-I:%M %p")
        all_day = False
    else:
        time_str = "All day"
        all_day = True

    return {
        "title": event.get("summary", "Untitled"),
        "time": time_str,
        "all_day": all_day,
        "location": event.get("location"),
    }


def get_tomorrow_events() -> dict[str, list[dict]]:
    """Return tomorrow's events grouped by calendar label.

    Returns:
        {"Personal": [...], "Leng Family": [...]}
    """
    creds = _get_credentials()
    service = build("calendar", "v3", credentials=creds)

    now_sgt = datetime.now(SGT)
    tomorrow = now_sgt.date() + timedelta(days=1)
    time_min = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 0, 0, 0, tzinfo=SGT).isoformat()
    time_max = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 23, 59, 59, tzinfo=SGT).isoformat()

    calendars = {
        "Personal": os.environ["GOOGLE_CALENDAR_ID_PERSONAL"],
        "Leng Family": os.environ["GOOGLE_CALENDAR_ID_FAMILY"],
    }

    events_by_calendar = {}
    for label, cal_id in calendars.items():
        raw_events = _fetch_events(service, cal_id, time_min, time_max)
        events_by_calendar[label] = [_parse_event(e) for e in raw_events]

    return events_by_calendar
