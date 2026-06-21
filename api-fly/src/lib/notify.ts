import { sendAgentmailHtml } from "./agentmail-send.js";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY ?? "";
const MSG91_TEMPLATE_ID_CARDIOLOGIST = process.env.MSG91_TEMPLATE_ID_CARDIOLOGIST ?? "";
const MSG91_TEMPLATE_ID_HEALTH_WORKER = process.env.MSG91_TEMPLATE_ID_HEALTH_WORKER ?? "";
const CARDIOLOGIST_PHONE = process.env.MSG91_CARDIOLOGIST_PHONE ?? "";
/** Optional: receive the same ECG alert via email (AgentMail). */
const NOTIFY_CARDIOLOGIST_EMAIL = (process.env.NOTIFY_CARDIOLOGIST_EMAIL ?? "").trim();
const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_PUBLIC_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface MSG91WhatsAppPayload {
  integrated_number: string;
  content_type: "template";
  payload: {
    messaging_product: "whatsapp";
    to: string;
    type: "template";
    template: {
      name: string;
      language: { code: string };
      components: Array<{
        type: "body";
        parameters: Array<{ type: "text"; text: string }>;
      }>;
    };
  };
}

async function sendMsg91Template(
  to: string,
  templateName: string,
  params: string[]
): Promise<void> {
  if (!MSG91_AUTH_KEY) {
    console.warn("[notify] MSG91_AUTH_KEY not set — skipping WhatsApp notification");
    return;
  }

  const toDigits = to.replace(/^\+/, "");

  const body: MSG91WhatsAppPayload = {
    integrated_number: CARDIOLOGIST_PHONE.replace(/^\+/, ""),
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      to: toDigits,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: params.map((text) => ({ type: "text", text })),
          },
        ],
      },
    },
  };

  const res = await fetch(
    "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
    {
      method: "POST",
      headers: {
        authkey: MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    console.error(`[notify] MSG91 error ${res.status}:`, text);
  }
}

export async function sendToCardiologist(opts: {
  patientName: string;
  age: number;
  village: string;
}): Promise<void> {
  const dashboardLink = `${APP_URL}/cardiologist`;
  await sendMsg91Template(CARDIOLOGIST_PHONE, MSG91_TEMPLATE_ID_CARDIOLOGIST, [
    opts.patientName,
    String(opts.age),
    opts.village,
    dashboardLink,
  ]);
  if (NOTIFY_CARDIOLOGIST_EMAIL) {
    const subject = `[HridLink] New ECG — ${opts.patientName}`;
    const html = `<p>A new ECG was uploaded for review.</p>
<ul>
<li><strong>Patient:</strong> ${escapeHtml(opts.patientName)}</li>
<li><strong>Age:</strong> ${escapeHtml(String(opts.age))}</li>
<li><strong>Village:</strong> ${escapeHtml(opts.village)}</li>
</ul>
<p><a href="${escapeHtml(dashboardLink)}">Open cardiologist dashboard</a></p>`;
    await sendAgentmailHtml(NOTIFY_CARDIOLOGIST_EMAIL, subject, html);
  }
}

export async function sendToHealthWorker(opts: {
  healthWorkerPhone: string;
  /** When set and AgentMail is configured, a copy is emailed in addition to WhatsApp. */
  healthWorkerEmail?: string | null;
  patientName: string;
  severity: string;
  recommendation: string;
}): Promise<void> {
  await sendMsg91Template(opts.healthWorkerPhone, MSG91_TEMPLATE_ID_HEALTH_WORKER, [
    opts.patientName,
    opts.severity,
    opts.recommendation,
  ]);
  const email = opts.healthWorkerEmail?.trim();
  if (email) {
    const subject = `[HridLink] ECG finding — ${opts.patientName} (${opts.severity})`;
    const html = `<p>An ECG finding was submitted for <strong>${escapeHtml(opts.patientName)}</strong>.</p>
<ul>
<li><strong>Severity:</strong> ${escapeHtml(opts.severity)}</li>
<li><strong>Recommendation:</strong> ${escapeHtml(opts.recommendation)}</li>
</ul>`;
    await sendAgentmailHtml(email, subject, html);
  }
}
