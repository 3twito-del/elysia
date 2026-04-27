import { Resend } from "resend";

import { env } from "~/env";

export type NotificationMessage = {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  html?: string;
};

export type NotificationResult = {
  id: string;
  provider: string;
};

export interface NotificationProvider {
  isOperational(): boolean;
  providerName(): string;
  sendEmail(message: NotificationMessage): Promise<NotificationResult>;
  sendOtp(identifier: string, code: string): Promise<NotificationResult>;
}

type BrevoSendEmailResponse = {
  messageId?: string;
};

let resendClient: Resend | null = null;

function getResend() {
  if (!env.RESEND_API_KEY) return null;
  resendClient ??= new Resend(env.RESEND_API_KEY);
  return resendClient;
}

function getSender() {
  return {
    email: env.STORE_FROM_EMAIL ?? "orders@aphrodite.local",
    name: env.STORE_FROM_NAME ?? "Aphrodite",
  };
}

function textToHtml(text: string) {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br />")}</p>`)
    .join("");
}

async function readProviderError(response: Response) {
  const fallback = `${response.status} ${response.statusText}`;

  try {
    const body = (await response.json()) as unknown;
    return JSON.stringify(body);
  } catch {
    return fallback;
  }
}

class BrevoNotificationProvider implements NotificationProvider {
  isOperational() {
    return Boolean(env.BREVO_API_KEY);
  }

  providerName() {
    return "brevo";
  }

  async sendEmail(message: NotificationMessage): Promise<NotificationResult> {
    if (!env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured.");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: getSender(),
        to: [
          {
            email: message.to,
            ...(message.toName ? { name: message.toName } : {}),
          },
        ],
        subject: message.subject,
        textContent: message.body,
        htmlContent: message.html ?? textToHtml(message.body),
      }),
    });

    if (!response.ok) {
      throw new Error(await readProviderError(response));
    }

    const result = (await response.json()) as BrevoSendEmailResponse;

    return {
      id: result.messageId ?? `brevo-${Date.now()}`,
      provider: this.providerName(),
    };
  }

  async sendOtp(identifier: string, code: string) {
    if (!identifier.includes("@")) {
      console.info("[notifications:sms-mock]", { identifier, code });
      return { id: `mock-sms-${Date.now()}`, provider: "sms-mock" };
    }

    return this.sendEmail({
      to: identifier,
      subject: "קוד הכניסה שלך ל-Aphrodite",
      body: `קוד הכניסה שלך הוא ${code}. הקוד תקף ל-10 דקות.`,
    });
  }
}

class ResendNotificationProvider implements NotificationProvider {
  isOperational() {
    return Boolean(env.RESEND_API_KEY);
  }

  providerName() {
    return "resend";
  }

  async sendEmail(message: NotificationMessage): Promise<NotificationResult> {
    const resend = getResend();

    if (!resend) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const sender = getSender();
    const result = await resend.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: message.to,
      subject: message.subject,
      text: message.body,
      html: message.html,
    });

    return {
      id: result.data?.id ?? `resend-${Date.now()}`,
      provider: this.providerName(),
    };
  }

  async sendOtp(identifier: string, code: string) {
    if (!identifier.includes("@")) {
      console.info("[notifications:sms-mock]", { identifier, code });
      return { id: `mock-sms-${Date.now()}`, provider: "sms-mock" };
    }

    return this.sendEmail({
      to: identifier,
      subject: "קוד הכניסה שלך ל-Aphrodite",
      body: `קוד הכניסה שלך הוא ${code}. הקוד תקף ל-10 דקות.`,
    });
  }
}

class MockNotificationProvider implements NotificationProvider {
  isOperational() {
    return false;
  }

  providerName() {
    return "mock";
  }

  async sendEmail(message: NotificationMessage) {
    console.info("[notifications:mock]", message);
    return { id: `mock-email-${Date.now()}`, provider: this.providerName() };
  }

  async sendOtp(identifier: string, code: string) {
    console.info("[notifications:otp-mock]", { identifier, code });
    return { id: `mock-otp-${Date.now()}`, provider: this.providerName() };
  }
}

function createNotificationProvider(): NotificationProvider {
  if (env.BREVO_API_KEY) return new BrevoNotificationProvider();
  if (env.RESEND_API_KEY) return new ResendNotificationProvider();
  return new MockNotificationProvider();
}

export const notificationProvider = createNotificationProvider();
