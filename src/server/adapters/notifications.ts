import { Resend } from "resend";

import { env } from "~/env";

export type NotificationMessage = {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  html?: string;
  idempotencyKey?: string;
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

export type NotificationEnv = {
  BREVO_API_KEY?: string;
  NODE_ENV: string;
  RESEND_API_KEY?: string;
};

export const PRODUCTION_EMAIL_PROVIDER_ERROR =
  "Production transactional email requires BREVO_API_KEY or RESEND_API_KEY.";

type BrevoSendEmailResponse = {
  messageId?: string;
};

type ResendSendError = {
  message?: string;
  name?: string;
  statusCode?: number | null;
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

function formatResendError(error: ResendSendError) {
  const details = [
    error.name,
    error.statusCode ? String(error.statusCode) : null,
    error.message,
  ]
    .filter(Boolean)
    .join(": ");

  return details || "Resend email send failed.";
}

function redactNotificationIdentifier(identifier: string) {
  const normalized = identifier.trim();

  if (!normalized) return "[redacted]";

  if (normalized.includes("@")) {
    const [localPart, domain] = normalized.split("@");
    const safeLocal = localPart ? `${localPart.slice(0, 1)}***` : "[redacted]";

    return domain ? `${safeLocal}@${domain}` : safeLocal;
  }

  const digits = normalized.replace(/\D/g, "");

  return digits.length >= 4 ? `***${digits.slice(-4)}` : "[redacted]";
}

function redactNotificationMessage(message: NotificationMessage) {
  return {
    to: redactNotificationIdentifier(message.to),
    toName: message.toName ? "[redacted]" : undefined,
    subject: message.subject,
    hasBody: Boolean(message.body),
    hasHtml: Boolean(message.html),
    idempotencyKey: message.idempotencyKey,
  };
}

function logMockOtp(tag: string, identifier: string) {
  console.info(tag, {
    identifier: redactNotificationIdentifier(identifier),
    code: "[redacted]",
  });
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
      logMockOtp("[notifications:sms-mock]", identifier);
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
    const result = await resend.emails.send(
      {
        from: `${sender.name} <${sender.email}>`,
        to: message.to,
        subject: message.subject,
        text: message.body,
        html: message.html,
      },
      message.idempotencyKey
        ? { idempotencyKey: message.idempotencyKey }
        : undefined,
    );

    if (result.error) {
      throw new Error(formatResendError(result.error));
    }

    return {
      id: result.data?.id ?? `resend-${Date.now()}`,
      provider: this.providerName(),
    };
  }

  async sendOtp(identifier: string, code: string) {
    if (!identifier.includes("@")) {
      logMockOtp("[notifications:sms-mock]", identifier);
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
    console.info("[notifications:mock]", redactNotificationMessage(message));
    return { id: `mock-email-${Date.now()}`, provider: this.providerName() };
  }

  async sendOtp(identifier: string, _code: string) {
    logMockOtp("[notifications:otp-mock]", identifier);
    return { id: `mock-otp-${Date.now()}`, provider: this.providerName() };
  }
}

class MissingProductionNotificationProvider implements NotificationProvider {
  isOperational() {
    return false;
  }

  providerName() {
    return "missing";
  }

  async sendEmail(): Promise<NotificationResult> {
    throw new Error(PRODUCTION_EMAIL_PROVIDER_ERROR);
  }

  async sendOtp(): Promise<NotificationResult> {
    throw new Error(PRODUCTION_EMAIL_PROVIDER_ERROR);
  }
}

export function createNotificationProvider(
  config: NotificationEnv = env,
): NotificationProvider {
  if (config.BREVO_API_KEY) return new BrevoNotificationProvider();
  if (config.RESEND_API_KEY) return new ResendNotificationProvider();
  if (config.NODE_ENV === "production") {
    return new MissingProductionNotificationProvider();
  }

  return new MockNotificationProvider();
}

export const notificationProvider = createNotificationProvider();
