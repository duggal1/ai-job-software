import { render } from "@react-email/render";
import { createElement } from "react";
import { Resend } from "resend";
import VerificationEmailPersonal from "./otp";
import OutreachEmail from "./outreach";

const resendApiKey = process.env.RESEND_API_KEY;
const resendEmailFrom = process.env.RESEND_EMAIL_FROM;
const appName = "Fly AI";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function getFromAddress(displayName?: string) {
  if (!resendEmailFrom) return null;
  const address = resendEmailFrom.includes("<")
    ? resendEmailFrom.slice(
        resendEmailFrom.lastIndexOf("<") + 1,
        resendEmailFrom.lastIndexOf(">"),
      )
    : resendEmailFrom;

  if (!displayName) {
    return resendEmailFrom.includes("<")
      ? resendEmailFrom
      : `${appName} <${resendEmailFrom}>`;
  }

  // Keep the verified address, only swap the display name. Resend rejects
  // arbitrary `from` domains, so this is the safe way to make it feel personal.
  return `${displayName} via ${appName} <${address}>`;
}

export type SendOtpParams = {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
};

export async function sendOtpEmail({ email, otp, type }: SendOtpParams) {
  const from = getFromAddress();
  if (!from || !resend) {
    throw new Error("RESEND_API_KEY and RESEND_EMAIL_FROM must be set.");
  }

  const subject =
    type === "sign-in"
      ? `Your ${appName} code`
      : type === "forget-password"
        ? `Reset your ${appName} password`
        : `Verify your ${appName} email`;

  const html = await render(
    createElement(VerificationEmailPersonal, {
      code: otp,
      appName,
    }),
  );

  const res = await resend.emails.send({
    from,
    to: email,
    subject,
    html,
  });

  if (res.error) throw new Error(`Resend failed: ${res.error.message}`);
}

export type SendOutreachParams = {
  to: string;
  subject: string;
  body: string;
  companyName: string;
  companyDomain?: string | null;
  replyTo?: string;
};

/**
 * Sends a founder-to-candidate outreach email. `from` keeps the verified
 * Resend address and only changes the display name, so no domain setup is
 * needed per company.
 */
export async function sendOutreachEmail({
  to,
  subject,
  body,
  companyName,
  companyDomain,
  replyTo,
}: SendOutreachParams) {
  const from = getFromAddress(companyName);
  if (!from || !resend) {
    throw new Error("RESEND_API_KEY and RESEND_EMAIL_FROM must be set.");
  }

  const html = await render(
    createElement(OutreachEmail, {
      previewText: subject,
      bodyText: body,
      companyName,
      companyDomain,
    }),
  );

  const res = await resend.emails.send({
    from,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (res.error) throw new Error(`Resend failed: ${res.error.message}`);
  return { id: res.data?.id ?? null };
}
