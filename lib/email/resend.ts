import { Resend } from "resend";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  sent: boolean;
  skipped?: boolean;
  id?: string;
  error?: string;
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send a transactional email via Resend.
 * Skips (logs) when RESEND_API_KEY or EMAIL_FROM are missing — never throws for config gaps.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM;
  const client = getResendClient();

  if (!client || !from) {
    const missing = [
      !process.env.RESEND_API_KEY ? "RESEND_API_KEY" : null,
      !from ? "EMAIL_FROM" : null,
    ]
      .filter(Boolean)
      .join(", ");

    const message = `Email skipped: missing ${missing}`;
    if (process.env.NODE_ENV === "production") {
      console.error(message);
    } else {
      console.warn(message);
    }
    return { sent: false, skipped: true, error: message };
  }

  const { data, error } = await client.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    console.error("Resend send failed:", error);
    return { sent: false, error: error.message };
  }

  return { sent: true, id: data?.id };
}
