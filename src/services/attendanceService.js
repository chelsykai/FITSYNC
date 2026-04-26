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
