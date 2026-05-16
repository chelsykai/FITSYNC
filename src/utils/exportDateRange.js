const pad = (value) => String(value).padStart(2, "0");

export const normalizeDateKey = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const dateOnlyMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateOnlyMatch) return dateOnlyMatch[1];

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

export const normalizeDateRange = (startDate, endDate) => {
  const start = normalizeDateKey(startDate);
  const end = normalizeDateKey(endDate);

  if (start && end && start > end) {
    return { start: end, end: start };
  }

  return { start, end };
};

export const isDateWithinRange = (value, startDate, endDate) => {
  const recordDate = normalizeDateKey(value);
  const { start, end } = normalizeDateRange(startDate, endDate);

  if (!start && !end) return true;
  if (!recordDate) return false;
  if (start && recordDate < start) return false;
  if (end && recordDate > end) return false;
  return true;
};