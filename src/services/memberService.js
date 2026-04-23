import { supabase } from "../lib/supabaseClient";

/**
 * Upload member photo to Supabase storage
 */
export const uploadMemberPhoto = async (file, memberId) => {
  if (!file) return null;

  const fileExt = file.name.split(".").pop();
  const fileName = `${memberId}.${fileExt}`;
  const filePath = `member_photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("members")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Return the public URL of the uploaded photo
  const { data } = supabase.storage.from("members").getPublicUrl(filePath);
  return data.publicUrl;
};

/**
 * Add a new member to the database
 */
export const addMember = async (memberData) => {
  const {
    fullName,
    email,
    phone,
    address,
    birthday,
    membershipType,
    monthlyValidity,
    membershipValidity,
    gender,
    photo,
  } = memberData;

  // Generate member ID
  const memberId =
    "FS-" +
    new Date().getFullYear() +
    "-" +
    String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0");

  // Upload photo if provided
  let photoUrl = null;
  if (photo) {
    photoUrl = await uploadMemberPhoto(photo, memberId);
  }

  // Get current date for join date
  const joinDate = new Date().toISOString().split("T")[0];

  // Insert member record into database
  const { data, error } = await supabase.from("member").insert([
    {
      member_id: memberId,
      full_name: fullName,
      email: email,
      phone: phone,
      address: address,
      birthday: birthday,
      membership_type: membershipType,
      monthly_validity: monthlyValidity,
      membership_validity: membershipValidity,
      gender: gender,
      photo_url: photoUrl,
      join_date: joinDate,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) throw error;

  return {
    member_id: memberId,
    full_name: fullName,
    email: email,
    phone: phone,
    address: address,
    birthday: birthday,
    membership_type: membershipType,
    monthly_validity: monthlyValidity,
    membership_validity: membershipValidity,
    gender: gender,
    photo_url: photoUrl,
    join_date: joinDate,
  };
};

/**
 * Fetch all members from the database
 */
export const fetchMembers = async () => {
  const { data, error } = await supabase
    .from("member")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Delete a member
 */
export const deleteMember = async (memberId) => {
  const { error } = await supabase
    .from("member")
    .delete()
    .eq("member_id", memberId);

  if (error) throw error;
};

/**
 * Update member details
 */
export const updateMember = async (memberId, updates) => {
  const { data, error } = await supabase
    .from("member")
    .update(updates)
    .eq("member_id", memberId)
    .select();

  if (error) throw error;
  return data?.[0] || null;
};
