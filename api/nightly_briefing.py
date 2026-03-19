"""Vercel serverless function: nightly WhatsApp briefing.

Triggered by Vercel cron at 9pm SGT (13:00 UTC) daily.
Can also be invoked manually via GET /api/nightly_briefing.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler

# Add project root to path so we can import the agents package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agents.whatsapp_briefing import run


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            result = run()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(
                json.dumps(
                    {
                        "ok": True,
                        "recipients": len(result["sids"]),
                        "message_preview": result["message"][:100],
                    }
                ).encode()
            )
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(
                json.dumps({"ok": False, "error": str(e)}).encode()
            )
