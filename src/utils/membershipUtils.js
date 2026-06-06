const DAY_MS = 24 * 60 * 60 * 1000;

const parseAmount = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return 0;

  const match = raw.match(/(\d+)/);
  if (!match) return 0;

  const amount = Number.parseInt(match[1], 10);
  return Number.isInteger(amount) && amount > 0 ? amount : 0;
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const formatValidityLabel = (value, unit) => {
  const raw = String(value || "").trim();
  if (!raw) return "N/A";
  if (/[a-z]/i.test(raw)) return raw;
  return `${raw} ${unit}${raw === "1" ? "" : "s"}`;
};

export const computeMembershipExpiryDate = (joinDate, membershipValidity, monthlyValidity) => {
  const baseDate = new Date(joinDate);
  if (Number.isNaN(baseDate.getTime())) return null;

  const years = parseAmount(membershipValidity);
  const months = parseAmount(monthlyValidity);

  if (!years && !months) return null;

  const expiryDate = new Date(baseDate);
  if (years) {
    expiryDate.setFullYear(expiryDate.getFullYear() + years);
  }
  if (months) {
    expiryDate.setMonth(expiryDate.getMonth() + months);
  }

  return expiryDate;
};

export const getMembershipExpiryDate = (member) => {
  if (member?.expiration_date) {
    const storedExpiry = new Date(member.expiration_date);
    if (!Number.isNaN(storedExpiry.getTime())) return storedExpiry;
  }

  if (!member?.join_date) return null;
  return computeMembershipExpiryDate(
    member.join_date,
    member.membership_validity,
    member.monthly_validity
  );
};

export const getMembershipDaysRemaining = (member, referenceDate = new Date()) => {
  const expiryDate = getMembershipExpiryDate(member);
  if (!expiryDate) return null;

  return Math.ceil((startOfDay(expiryDate).getTime() - startOfDay(referenceDate).getTime()) / DAY_MS);
};

export const isMembershipActive = (member, referenceDate = new Date()) => {
  const daysRemaining = getMembershipDaysRemaining(member, referenceDate);
  if (daysRemaining === null) return false;
  return daysRemaining >= 0;
};

export const isMembershipExpiringSoon = (member, days = 14, referenceDate = new Date()) => {
  const daysRemaining = getMembershipDaysRemaining(member, referenceDate);
  if (daysRemaining === null) return false;
  return daysRemaining >= 0 && daysRemaining <= days;
};