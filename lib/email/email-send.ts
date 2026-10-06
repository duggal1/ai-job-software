import { render } from "@react-email/render";
import { createElement } from "react";
import { Resend } from "resend";
import VerificationEmailPersonal from "./otp";

const resendApiKey = process.env.RESEND_API_KEY;
const resendEmailFrom = process.env.RESEND_EMAIL_FROM;
const appName = "Fly AI";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function getFromAddress() {
  if (!resendEmailFrom) return null;
  return resendEmailFrom.includes("<")
    ? resendEmailFrom
    : `${appName} <${resendEmailFrom}>`;
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
