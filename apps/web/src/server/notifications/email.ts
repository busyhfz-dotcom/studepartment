/**
 * Minimal outbound-email boundary.
 *
 * Studepartment does not bundle an email-provider SDK. When RESEND_API_KEY
 * and DIGEST_FROM_EMAIL are configured, this sends through the Resend HTTP
 * API (a plain fetch call, no extra dependency). When they are not
 * configured, sends are logged and reported as unsent rather than silently
 * pretending to succeed — callers must treat `sent: false` as "no email
 * left this deployment," not as an error to retry indefinitely.
 */

export type EmailSendResult = {
  sent: boolean;
  reason?: string;
};

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.DIGEST_FROM_EMAIL?.trim());
}

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.DIGEST_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    console.info("[email] delivery not configured; skipped send", { to: message.to, subject: message.subject });
    return { sent: false, reason: "EMAIL_DELIVERY_NOT_CONFIGURED" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[email] provider rejected send", response.status, body.slice(0, 500));
      return { sent: false, reason: `PROVIDER_ERROR_${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error("[email] send failed", error);
    return { sent: false, reason: "SEND_EXCEPTION" };
  }
}
