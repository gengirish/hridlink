# AgentMail (email notifications)

HridLink sends **WhatsApp** via MSG91 from the Fly API (`api-fly`). **HTML email** for the same events uses [AgentMail](https://agentmail.to/) when `AGENTMAIL_API_KEY` is set on the Fly app (or in `api-fly` local env).

## Environment variables (Fly / `api-fly`)

| Variable | Required | Description |
|----------|----------|-------------|
| `AGENTMAIL_API_KEY` | Yes, for email | API key from the AgentMail dashboard. |
| `AGENTMAIL_DOMAIN` | No | Defaults to `agentmail.to`. |
| `AGENTMAIL_INBOX_USERNAME` | No | Defaults to `noreply`. The API resolves `username@domain` as the sending inbox, creating it if missing (unless `AGENTMAIL_INBOX_ID` is set). |
| `AGENTMAIL_INBOX_ID` | No | If set, skips list/create and sends from this inbox id. |
| `NOTIFY_CARDIOLOGIST_EMAIL` | No | When set, **new ECG upload** alerts are emailed here in addition to MSG91 to the cardiologist WhatsApp number. |

Health workers receive a **finding** email when a cardiologist saves a finding **and** the uploader’s `User.email` is present (same send path as MSG91 to the uploader’s phone).

## Vercel

Do **not** duplicate these on Vercel for production: proxied `/api/ecg` traffic runs on Fly. For local `npm run dev:stack`, put AgentMail variables in the environment used by `api-fly` (e.g. `api-fly/.env` if you create one, or export before `npm run dev` in that folder).

## Implementation

- `api-fly/src/lib/agentmail-send.ts` — client, inbox resolution, `sendAgentmailHtml`.
- `api-fly/src/lib/notify.ts` — calls AgentMail after MSG91 where applicable.

Dependency: `agentmail` in `api-fly/package.json`.
