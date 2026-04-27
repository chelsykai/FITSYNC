import { supabase } from "../lib/supabaseClient";

const formatDate = (date) => date.toISOString().split("T")[0];

const formatTime = (date) =>
  date.toTimeString().slice(0, 8);

export const recordMemberAttendance = async (member) => {
  const memberId = member?.member_id || member?.memberId || member?.id;
  const memberName = member?.full_name || member?.name || "Unknown";

  if (!memberId) {
    throw new Error("Member ID is required to record attendance.");
  }

  const now = new Date();
  const attendanceDate = formatDate(now);
  const attendanceTime = formatTime(now);

  const { data, error } = await supabase
    .from("member_attendance")
    .insert({
      member_id: memberId,
      member_name: memberName,
      attendance_date: attendanceDate,
      attendance_time: attendanceTime,
    })
    .select("member_id, member_name, attendance_date, attendance_time")
    .single();

  if (error) throw error;
  return data;
};

export const fetchTodayAttendanceCount = async () => {
  const today = formatDate(new Date());

  const { count, error } = await supabase
    .from("member_attendance")
    .select("id", { count: "exact", head: true })
    .eq("attendance_date", today);

  if (error) throw error;
  return count || 0;
};

export const fetchMonthlyAttendanceCounts = async (year) => {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from("member_attendance")
    .select("attendance_date")
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);

  if (error) throw error;

  const monthCounts = Array(12).fill(0);
  (data || []).forEach((row) => {
    if (!row.attendance_date) return;
    const parts = String(row.attendance_date).split("-");
    const month = Number(parts[1]);
    if (month >= 1 && month <= 12) {
      monthCounts[month - 1] += 1;
    }
  });

  return monthCounts;
};

export const fetchTodayAttendanceByTimeBins = async () => {
  const today = formatDate(new Date());

  const { data, error } = await supabase
    .from("member_attendance")
    .select("attendance_time")
    .eq("attendance_date", today);

  if (error) throw error;

  // 12 bins: 00-01, 02-03, ..., 22-23
  const binCounts = Array(12).fill(0);
  (data || []).forEach((row) => {
    if (!row.attendance_time) return;
    const hour = Number(String(row.attendance_time).slice(0, 2));
    if (Number.isNaN(hour) || hour < 0 || hour > 23) return;
    const binIndex = Math.floor(hour / 2);
    binCounts[binIndex] += 1;
  });

  return binCounts;
};

export const fetchCurrentMonthAttendanceByDay = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("member_attendance")
    .select("attendance_date")
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);

  if (error) throw error;

  const dayCounts = Array(daysInMonth).fill(0);
  (data || []).forEach((row) => {
    if (!row.attendance_date) return;
    const day = Number(String(row.attendance_date).slice(8, 10));
    if (day >= 1 && day <= daysInMonth) {
      dayCounts[day - 1] += 1;
    }
  });

  return dayCounts;
};

export const fetchCurrentYearAttendanceByMonth = async () => {
  const year = new Date().getFullYear();
  return fetchMonthlyAttendanceCounts(year);
};
