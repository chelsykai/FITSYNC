import emailjs from "@emailjs/browser";
import { supabase } from "../lib/supabaseClient";

const requiredEnv = [
  "VITE_EMAILJS_PUBLIC_KEY",
  "VITE_EMAILJS_SERVICE_ID",
  "VITE_EMAILJS_TEMPLATE_ID_NOTIFICATION",
];

function assertEmailConfig() {
  const missing = requiredEnv.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing EmailJS config: ${missing.join(", ")}`);
  }

  return {
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_NOTIFICATION,
  };
}

/**
 * Uploads a QR PNG data URL to Supabase Storage and returns the public HTTPS URL.
 * Requires a public bucket named "member-qr-codes" in your Supabase project.
 */
export async function uploadQRAndGetUrl(memberId, qrDataUrl) {
  const blob = await (await fetch(qrDataUrl)).blob();
  const path = `${memberId}.png`;

  const { error } = await supabase.storage
    .from("member-qr-codes")
    .upload(path, blob, { contentType: "image/png", upsert: true });

  if (error) throw new Error(`QR upload failed: ${error.message}`);

  const { data } = supabase.storage.from("member-qr-codes").getPublicUrl(path);
  return data.publicUrl;
}

export async function sendMemberWelcomeEmail(member, qrPublicUrl) {
  if (!member?.email) {
    throw new Error("Member has no email address.");
  }

  const welcomeTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_WELCOME;
  if (!welcomeTemplateId) {
    throw new Error("Missing EmailJS config: VITE_EMAILJS_TEMPLATE_ID_WELCOME");
  }

  const { publicKey, serviceId } = assertEmailConfig();

  const templateParams = {
    to_name:   member.fullName  || member.full_name  || "Member",
    to_email:  member.email,
    member_id: member.memberId  || member.member_id  || "",
    qr_url:    qrPublicUrl,
    app_name:  "FitSync",
  };

  return emailjs.send(serviceId, welcomeTemplateId, templateParams, { publicKey });
}

function buildMessage(notification) {
  const safeDays = Number.isFinite(notification?.daysRemaining)
    ? Math.abs(notification.daysRemaining)
    : 0;

  if (notification.type === "OVERDUE BALANCE") {
    return `Your account has an overdue balance of ${notification.overdueAmountText}. Please settle your balance as soon as possible to keep your membership active.`;
  }

  if (notification.type === "MEMBERSHIP OVERDUE") {
    return `Your membership is overdue by ${safeDays} day(s). Expiry date: ${notification.expiryText}. Please renew as soon as possible to continue accessing gym services.`;
  }

  if (notification.type === "MEMBERSHIP EXPIRED") {
    return `Your membership has expired${notification.expiryText ? ` on ${notification.expiryText}` : ""}. Please renew to continue accessing gym services.`;
  }

  return `Your membership will expire in ${safeDays} day(s)${notification.expiryText ? ` on ${notification.expiryText}` : ""}. Please renew before the expiry date.`;
 } 

export async function sendMemberNotificationEmail(member, notification) {
  if (!member?.email) {
    throw new Error("Member has no email address.");
  }

  const config = assertEmailConfig();

  const templateParams = {
    to_name: member.full_name || "Member",
    to_email: member.email,
    member_id: member.member_id || "",
    notification_type: notification.type,
    detail: notification.detail,
    overdue_amount: notification.overdueAmountText || "",
    days_remaining:
      typeof notification.daysRemaining === "number"
        ? String(Math.abs(notification.daysRemaining))
        : "",
    expiry_date: notification.expiryText || "",
    message: buildMessage(notification),
    app_name: "FitSync",
  };

  return emailjs.send(
    config.serviceId,
    config.templateId,
    templateParams,
    { publicKey: config.publicKey }
  );
}
