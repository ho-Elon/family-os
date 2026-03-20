"""Fetch today's weather for Singapore from Open-Meteo (free, no API key)."""

import json
import urllib.request
import urllib.error

# Singapore coordinates
_LAT, _LON = 1.3521, 103.8198

_URL = (
    f"https://api.open-meteo.com/v1/forecast"
    f"?latitude={_LAT}&longitude={_LON}"
    f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode"
    f"&timezone=Asia/Singapore&forecast_days=1"
)

# WMO weather codes to descriptions
_WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Foggy", 51: "Light drizzle", 53: "Drizzle",
    55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
    80: "Light showers", 81: "Showers", 82: "Heavy showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm",
}


def get_singapore_weather() -> dict:
    """Fetch today's weather summary for Singapore.

    Returns:
        Dict with keys: high, low, rain_chance, description
    """
    req = urllib.request.Request(_URL, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
    except (urllib.error.URLError, json.JSONDecodeError):
        return {"high": None, "low": None, "rain_chance": None, "description": "Unavailable"}

    daily = data.get("daily", {})
    code = (daily.get("weathercode") or [None])[0]

    return {
        "high": (daily.get("temperature_2m_max") or [None])[0],
        "low": (daily.get("temperature_2m_min") or [None])[0],
        "rain_chance": (daily.get("precipitation_probability_max") or [None])[0],
        "description": _WMO_CODES.get(code, "Unknown"),
    }
