import emailjs from "@emailjs/browser";

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
