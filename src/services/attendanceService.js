import { supabase } from "../lib/supabaseClient";

const MANILA_TZ = "Asia/Manila";

const formatDate = (date) => {
  try {
    // Use en-CA so the formatted date is YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", { timeZone: MANILA_TZ }).format(date);
  } catch (e) {
    // Fallback to manual offset (+8) if Intl fails
    const d = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  }
};

const formatTime = (date) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: MANILA_TZ,
    }).format(date);
  } catch (e) {
    const d = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const timeStr = d.toTimeString().slice(0, 8);
    const [hours, minutes, seconds] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${String(displayHour).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
  }
};

export const fetchTodayAttendanceForMember = async (memberId) => {
  const today = formatDate(new Date());

  const { data, error } = await supabase
    .from("member_attendance")
    .select("id, member_id, member_name, attendance_date, attendance_time")
    .eq("member_id", memberId)
    .eq("attendance_date", today)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
};

export const recordMemberAttendance = async (member) => {
  const memberId = member?.member_id || member?.memberId || member?.id;
  const memberName = member?.full_name || member?.name || "Unknown";

  if (!memberId) {
    throw new Error("Member ID is required to record attendance.");
  }

  const now = new Date();
  const attendanceDate = formatDate(now);
  const attendanceTime = formatTime(now);

  const existingAttendance = await fetchTodayAttendanceForMember(memberId);
  if (existingAttendance) {
    const duplicateError = new Error(
      `${memberName} has already been scanned today.`
    );
    duplicateError.code = "ATTENDANCE_ALREADY_RECORDED";
    duplicateError.details = existingAttendance;
    throw duplicateError;
  }

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

export const fetchAttendanceForMembersMonth = async (memberIds = [], year, month) => {
  // month is 1-based (1 = Jan)
  if (!year || !month) {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  let query = supabase
    .from("member_attendance")
    .select("member_id, attendance_date, attendance_time")
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);

  if (Array.isArray(memberIds) && memberIds.length > 0) {
    query = query.in("member_id", memberIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Build maps: member_id -> { day -> { attended: bool, time: string } }
  const attendanceMap = {};
  const timeMap = {};
  (data || []).forEach((row) => {
    if (!row || !row.member_id || !row.attendance_date) return;
    const day = Number(String(row.attendance_date).slice(8, 10));
    if (!attendanceMap[row.member_id]) attendanceMap[row.member_id] = new Set();
    if (!timeMap[row.member_id]) timeMap[row.member_id] = {};
    attendanceMap[row.member_id].add(day);
    
    // Convert attendance_time to Philippine 12-hour format with AM/PM
    let formattedTime = row.attendance_time || "";
    if (formattedTime) {
      const [hours, minutes, seconds] = formattedTime.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      formattedTime = `${String(displayHour).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
    }
    timeMap[row.member_id][day] = formattedTime;
  });

  return { attendanceMap, timeMap, daysInMonth, year, month };
};
