/**
 * Add N working days to a date (skips Sat & Sun)
 */
export function addWorkingDays(startDate, days) {
  let count = 0;
  const date = new Date(startDate);
  while (count < days) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return date;
}

/**
 * Count working days left until a deadline date string (YYYY-MM-DD)
 */
export function getWorkingDaysLeft(deadlineStr) {
  if (!deadlineStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(deadlineStr);
  end.setHours(0, 0, 0, 0);
  if (today >= end) return 0;
  let count = 0;
  const cursor = new Date(today);
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}
