import { supabase } from "../lib/supabaseClient";

const todayDateString = () => new Date().toISOString().split("T")[0];

export const fetchWalkIns = async () => {
  const { data, error } = await supabase
    .from("walk_in")
    .select("id, name, payment_date, plan_type, total, status, created_at")
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((record) => ({
    id: record.id,
    name: record.name || "Guest",
    paymentDate: record.payment_date || todayDateString(),
    planType: record.plan_type || "Daily",
    total: Number(record.total) || 0,
    status: record.status || "Paid",
    created_at: record.created_at || null,
  }));
};

export const fetchTodayWalkInCount = async () => {
  const today = todayDateString();

  const { count, error } = await supabase
    .from("walk_in")
    .select("id", { count: "exact", head: true })
    .eq("payment_date", today);

  if (error) throw error;
  return count || 0;
};

export const addWalkInRecord = async ({ name, paymentDate, planType, total, status = "Paid" }) => {
  const payload = {
    name: name?.trim() || "Guest",
    payment_date: paymentDate || todayDateString(),
    plan_type: planType || "Daily",
    total: Number(total) || 0,
    status,
  };

  const { data, error } = await supabase
    .from("walk_in")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};