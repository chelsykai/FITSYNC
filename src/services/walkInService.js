import { supabase } from "../lib/supabaseClient";

const todayDateString = () => new Date().toISOString().split("T")[0];

export const fetchWalkIns = async () => {
  console.log("[fetchWalkIns] Fetching walk-in records from walkin_records table...");
  const { data, error } = await supabase
    .from("walkin_records")
    .select("walkin_transac_id, name, date, plan_type, amount")
    .order("date", { ascending: false })
    .order("walkin_transac_id", { ascending: false });

  if (error) {
    console.error("[fetchWalkIns] Supabase error:", error);
    throw error;
  }

  console.log("[fetchWalkIns] Raw data from Supabase:", data);
  
  const mapped = (data || []).map((record) => ({
    id: record.walkin_transac_id,
    name: record.name || "Guest",
    paymentDate: record.date || todayDateString(),
    planType: record.plan_type || "Daily",
    total: Number(record.amount) || 0,
  }));
  
  console.log("[fetchWalkIns] Mapped data:", mapped);
  return mapped;
};

export const fetchTodayWalkInCount = async () => {
  const today = todayDateString();

  const { count, error } = await supabase
    .from("walkin_records")
    .select("walkin_transac_id", { count: "exact", head: true })
    .eq("date", today);

  if (error) throw error;
  return count || 0;
};

export const addWalkInRecord = async ({ name, paymentDate, planType, total }) => {
  const payload = {
    name: name?.trim() || "Guest",
    date: paymentDate || todayDateString(),
    plan_type: planType || "Daily",
    amount: Number(total) || 0,
  };

  const { data, error } = await supabase
    .from("walkin_records")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};