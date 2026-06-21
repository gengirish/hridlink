const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY ?? "";
const MSG91_TEMPLATE_ID_CARDIOLOGIST = process.env.MSG91_TEMPLATE_ID_CARDIOLOGIST ?? "";
const MSG91_TEMPLATE_ID_HEALTH_WORKER = process.env.MSG91_TEMPLATE_ID_HEALTH_WORKER ?? "";
const CARDIOLOGIST_PHONE = process.env.MSG91_CARDIOLOGIST_PHONE ?? "";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://hridlink.com").replace(/\/$/, "");

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
}

export async function sendToHealthWorker(opts: {
  healthWorkerPhone: string;
  patientName: string;
  severity: string;
  recommendation: string;
}): Promise<void> {
  await sendMsg91Template(opts.healthWorkerPhone, MSG91_TEMPLATE_ID_HEALTH_WORKER, [
    opts.patientName,
    opts.severity,
    opts.recommendation,
  ]);
}
