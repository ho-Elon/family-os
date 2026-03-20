"""Vercel serverless function: Thursday volleyball reminder.

Triggered by Vercel cron every Thursday at 6:15am SGT (22:15 UTC Wednesday).
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agents.morning_brief import send_thursday_reminder


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            result = send_thursday_reminder()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(
                json.dumps({"ok": True, "message": result["message"]}).encode()
            )
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode())
