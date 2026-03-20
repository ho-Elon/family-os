"""Fetch overnight FX moves from Yahoo Finance."""

import json
import urllib.request
import urllib.error

FX_PAIRS = {
    "USDMYR": "MYR=X",
    "EURUSD": "EURUSD=X",
    "GBPUSD": "GBPUSD=X",
    "USDJPY": "JPY=X",
}

_YF_URL = (
    "https://query1.finance.yahoo.com/v8/finance/spark"
    "?symbols={symbols}&range=1d&interval=1d"
)


def get_fx_moves() -> list[dict]:
    """Fetch current price and daily change for key FX pairs.

    Returns:
        List of dicts with keys: pair, price, change_pct
    """
    symbols = ",".join(FX_PAIRS.values())
    url = _YF_URL.format(symbols=symbols)

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
    except (urllib.error.URLError, json.JSONDecodeError):
        return []

    results = []
    for pair_label, symbol in FX_PAIRS.items():
        spark = data.get("spark", {}).get("result", [])
        match = next((s for s in spark if s.get("symbol") == symbol), None)
        if not match:
            results.append({"pair": pair_label, "price": None, "change_pct": None})
            continue

        meta = match.get("response", [{}])[0].get("meta", {})
        price = meta.get("regularMarketPrice")
        prev_close = meta.get("previousClose") or meta.get("chartPreviousClose")

        change_pct = None
        if price and prev_close:
            change_pct = round((price - prev_close) / prev_close * 100, 2)

        results.append({
            "pair": pair_label,
            "price": round(price, 4) if price else None,
            "change_pct": change_pct,
        })

    return results
