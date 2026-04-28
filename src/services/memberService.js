import { supabase } from "../lib/supabaseClient";

const MEMBER_PHOTO_BUCKET = "member_photo";
const MEMBER_PHOTO_PREFIX = "member_photos";

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

const getStoragePathFromUrl = (value) => {
  if (!value || typeof value !== "string") return null;

  if (value.startsWith(`${MEMBER_PHOTO_PREFIX}/`)) {
    return value;
  }

  const marker = `/object/public/${MEMBER_PHOTO_BUCKET}/`;
  const markerIndex = value.indexOf(marker);
  if (markerIndex === -1) return null;

  return value.slice(markerIndex + marker.length);
};

const getPhotoAccessUrl = async (photoRef) => {
  if (!photoRef) return null;

  // Keep existing fully-qualified URLs working for legacy rows.
  if (photoRef.startsWith("http://") || photoRef.startsWith("https://")) {
    return photoRef;
  }

  // New records store the storage object path in photo_url.
  const { data, error } = await supabase.storage
    .from(MEMBER_PHOTO_BUCKET)
    .createSignedUrl(photoRef, 60 * 60);

  if (!error && data?.signedUrl) {
    return data.signedUrl;
  }

  const { data: publicData } = supabase.storage
    .from(MEMBER_PHOTO_BUCKET)
    .getPublicUrl(photoRef);
  return publicData?.publicUrl || null;
};

/**
 * Upload member photo to Supabase storage
 */
export const uploadMemberPhoto = async (file, memberId) => {
  if (!file) return null;

  const safeName = sanitizeFileName(file.name || "photo");
  const filePath = `${MEMBER_PHOTO_PREFIX}/${memberId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(MEMBER_PHOTO_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    });

  if (uploadError) throw uploadError;

  // Store object path so it stays linked to this member regardless of bucket visibility.
  return filePath;
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
    "MEM-" +
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
  const payload = {
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
  };

  const { data, error } = await supabase
    .from("member")
    .insert([payload])
    .select()
    .single();

  if (error) {
    // Prevent orphaned uploads when insert fails.
    if (photoUrl) {
      await supabase.storage.from(MEMBER_PHOTO_BUCKET).remove([photoUrl]);
    }
    throw error;
  }

  const photoAccessUrl = await getPhotoAccessUrl(data.photo_url);

  return {
    ...data,
    photo_url: photoAccessUrl,
    // Compatibility keys used by existing confirmation modal.
    memberId: data.member_id,
    fullName: data.full_name,
    membershipType: data.membership_type,
  };
};

/**
 * Fetch all members from the database
 */
export const fetchMembers = async () => {
  // Try to select last_visit if the column exists; if it doesn't, retry without it.
  let data;
  try {
    const resp = await supabase
      .from("member")
      .select(
        "member_id, full_name, membership_type, email, phone, address, birthday, gender, photo_url, join_date, monthly_validity, membership_validity, last_visit, created_at"
      )
      .order("created_at", { ascending: false });

    if (resp.error) throw resp.error;
    data = resp.data || [];
  } catch (err) {
    // If last_visit column is missing, retry without it. Otherwise rethrow.
    const msg = (err && err.message) || String(err);
    if (msg.includes("last_visit") || msg.includes("member.last_visit") || msg.includes("column \"member.last_visit\" does not exist")) {
      const resp2 = await supabase
        .from("member")
        .select(
          "member_id, full_name, membership_type, email, phone, address, birthday, gender, photo_url, join_date, monthly_validity, membership_validity, created_at"
        )
        .order("created_at", { ascending: false });

      if (resp2.error) throw resp2.error;
      data = resp2.data || [];
    } else {
      throw err;
    }
  }

  const members = data || [];
  return Promise.all(
    members.map(async (member) => {
      try {
        const photoPath = getStoragePathFromUrl(member.photo_url);
        if (!photoPath) return member;

        const photoUrl = await getPhotoAccessUrl(photoPath);
        return {
          ...member,
          photo_url: photoUrl,
        };
      } catch (err) {
        // If photo retrieval fails for a single member, log and return the raw member so UI can still render.
        // This prevents one broken storage entry from causing the entire fetch to fail.
        // eslint-disable-next-line no-console
        console.warn('Failed to get photo URL for member', member?.member_id, err);
        return member;
      }
    })
  );
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
