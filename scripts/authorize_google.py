"""One-time Google OAuth2 authorization script.

Run this locally to authorize calendar access and obtain a refresh token.
The refresh token should be added to your .env file and Vercel environment.

Usage:
    python scripts/authorize_google.py
"""

import json
import os
import sys

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..")
CREDENTIALS_FILE = os.path.join(PROJECT_ROOT, "google-credentials.json")
TOKEN_FILE = os.path.join(PROJECT_ROOT, "token.json")


def main():
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"Error: {CREDENTIALS_FILE} not found.")
        print("Place your Google OAuth2 client credentials JSON in the project root.")
        sys.exit(1)

    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
    creds = flow.run_local_server(port=0)

    # Save token.json for local use by the agent
    with open(TOKEN_FILE, "w") as f:
        f.write(creds.to_json())

    print("\n" + "=" * 60)
    print("Authorization successful!")
    print("=" * 60)
    print(f"\nSaved credentials to {TOKEN_FILE}")
    print("The agent will use this file automatically for local runs.")
    print("\nFor Vercel deployment, add these environment variables:\n")

    # Read client ID/secret from the credentials file
    with open(CREDENTIALS_FILE) as f:
        client_config = json.load(f)
        config = client_config.get("installed") or client_config.get("web", {})

    print(f'GOOGLE_CLIENT_ID={config.get("client_id", "")}')
    print(f'GOOGLE_CLIENT_SECRET={config.get("client_secret", "")}')
    print(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}")
    print()


if __name__ == "__main__":
    main()
