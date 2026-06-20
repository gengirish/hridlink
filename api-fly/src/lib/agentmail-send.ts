import { AgentMailClient } from "agentmail";

function stripEnv(s: string | undefined): string | undefined {
  if (s == null) return undefined;
  const t = s.replace(/^\uFEFF/, "").replace(/\u200b/g, "").trim();
  return t.length > 0 ? t : undefined;
}

const apiKey = stripEnv(process.env.AGENTMAIL_API_KEY);
const domain = stripEnv(process.env.AGENTMAIL_DOMAIN) ?? "agentmail.to";
const inboxUsername = stripEnv(process.env.AGENTMAIL_INBOX_USERNAME) ?? "noreply";

let client: AgentMailClient | null | undefined;
let resolvedInboxId: string | undefined;

function getClient(): AgentMailClient | null {
  if (client !== undefined) return client;
  if (!apiKey) {
    client = null;
    return null;
  }
  client = new AgentMailClient({ apiKey });
  return client;
}

async function resolveSystemInboxId(c: AgentMailClient): Promise<string | null> {
  if (resolvedInboxId) return resolvedInboxId;
  const preset = stripEnv(process.env.AGENTMAIL_INBOX_ID);
  if (preset) {
    resolvedInboxId = preset;
    return preset;
  }
  const prefix = `${inboxUsername}@`.toLowerCase();
  try {
    let pageToken: string | undefined;
    for (;;) {
      const list = await c.inboxes.list(pageToken ? { pageToken } : undefined);
      const hit = list.inboxes.find((x) => String(x.email).toLowerCase().startsWith(prefix));
      if (hit) {
        resolvedInboxId = hit.inboxId;
        return hit.inboxId;
      }
      pageToken = list.nextPageToken ?? undefined;
      if (!pageToken) break;
    }
    const created = await c.inboxes.create({
      username: inboxUsername,
      domain,
      displayName: "HridLink notifications",
    });
    resolvedInboxId = created.inboxId;
    return created.inboxId;
  } catch (e) {
    console.error("[agentmail] could not resolve or create system inbox:", e);
    return null;
  }
}

/**
 * Send HTML email via AgentMail when `AGENTMAIL_API_KEY` is set.
 * No-ops with a console warning when disabled (same pattern as MSG91).
 */
export async function sendAgentmailHtml(to: string, subject: string, html: string): Promise<void> {
  const c = getClient();
  if (!c) {
    console.warn("[agentmail] AGENTMAIL_API_KEY not set — skipping email");
    return;
  }
  const inboxId = await resolveSystemInboxId(c);
  if (!inboxId) return;
  try {
    await c.inboxes.messages.send(inboxId, {
      to: [to],
      subject,
      html,
    });
  } catch (e) {
    console.error("[agentmail] send failed:", e);
  }
}
