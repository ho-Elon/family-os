"""Vercel serverless function: 7am personal morning brief.

Triggered by Vercel cron at 7am SGT (23:00 UTC previous day) daily.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agents.morning_brief import run


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            result = run()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(
                json.dumps({
                    "ok": True,
                    "message_preview": result["message"][:100],
                }).encode()
            )
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode())
