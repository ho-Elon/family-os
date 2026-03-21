# CLAUDE.md — Standing Instructions for family-os

## Project
This is Hoelon's family-os project.

## Git Workflow
- Always auto-commit and push without asking.
- Never ask for PR approval — push directly to master.

## Agents

### Morning Brief (`agents/morning_brief/`)
- Recipient: Hoelon (+6586116668) only.
- Runs daily at 7am SGT.

### Nightly Family Briefing (`agents/whatsapp_briefing/`)
- Sends to all 6 family members.
- Runs daily at 9pm SGT.

## Shared Infrastructure
- All agents use **dotenv** for config (`.env` in project root).
- Google Calendar auth via **OAuth2 with `token.json`** (falls back to env vars).
- WhatsApp delivery via **Twilio WhatsApp sandbox**.

## Development Rules
- When fixing bugs, **test before committing**.
- Don't rename functions without checking all references first.
