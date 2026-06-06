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
  try {
    const blob = await (await fetch(qrDataUrl)).blob();
    const path = `${memberId}.png`;

    const { error } = await supabase.storage
      .from("member-qr-codes")
      .upload(path, blob, { contentType: "image/png", upsert: true });

    if (error) {
      // Provide helpful error messages for common RLS issues
      if (error.message.includes("row-level security")) {
        throw new Error(
          "QR upload failed: Missing or incorrect RLS policies on member-qr-codes bucket. " +
          "See SUPABASE_RLS_SETUP.md for configuration."
        );
      }
      if (error.message.includes("not found")) {
        throw new Error(
          "QR upload failed: member-qr-codes bucket does not exist. " +
          "Create it in Supabase Storage and configure RLS policies."
        );
      }
      throw new Error(`QR upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from("member-qr-codes").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    throw new Error(err.message || "Failed to upload QR code");
  }
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
  const dayWord = safeDays === 1 ? "day" : "days";

  if (notification.type === "OVERDUE BALANCE") {
    return `Your account has an overdue balance of ${notification.overdueAmountText}. Please settle your balance as soon as possible to keep your membership active.`;
  }

  if (notification.type === "MEMBERSHIP OVERDUE") {
    return `Your membership is overdue by ${safeDays} ${dayWord}. Expiry date: ${notification.expiryText}. Please renew as soon as possible to continue accessing gym services.`;
  }

  if (notification.type === "MEMBERSHIP EXPIRED") {
    return `Your membership has expired${notification.expiryText ? ` on ${notification.expiryText}` : ""}. Please renew to continue accessing gym services.`;
  }

  return `Your membership will expire in ${safeDays} ${dayWord}${notification.expiryText ? ` on ${notification.expiryText}` : ""}. Please renew before the expiry date.`;
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function sendMemberNotificationEmail(member, notification) {
  if (!member?.email) {
    throw new Error("Member has no email address.");
  }

  const config = assertEmailConfig();
  const isOverdueBalance = notification.type === "OVERDUE BALANCE";
  const isExpiring = notification.type === "MEMBERSHIP EXPIRING";
  const safeDays = Number.isFinite(notification?.daysRemaining)
    ? Math.abs(notification.daysRemaining)
    : 0;

  const templateParams = {
    to_name: member.full_name || "Member",
    to_email: member.email,
    member_id: member.member_id || "",
    notification_type: toTitleCase(notification.type),
    detail: notification.detail,
    overdue_amount: isOverdueBalance ? (notification.overdueAmountText || "") : "N/A",
    days_remaining: isExpiring ? String(safeDays) : "N/A",
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
