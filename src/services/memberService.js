import { supabase } from "../lib/supabaseClient";
import { getAuditActorRole } from "./auditService";
import { requireAdminRole } from "../utils/permissions";

const MEMBER_PHOTO_BUCKET = "member_photo";
const MEMBER_PHOTO_PREFIX = "member_photos";

const logAuditTrail = async (action, memberId, memberName, changes = {}) => {
  try {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const actorName = currentUser?.name || currentUser?.username || 'system';
    const actorRole = await getAuditActorRole();

    // Try new schema first
    let result = await supabase.from('audit_trail').insert([{
      user_name: actorName,
      user_role: actorRole,
      action_performed: action,
      affected_module: 'Members',
      affected_data: {
        memberId,
        memberName,
        ...changes,
      },
      created_at: new Date().toISOString(),
    }]);

    // If new schema fails, fallback to legacy schema
    if (result.error) {
      console.log('New schema failed, trying legacy schema...', result.error);
      result = await supabase.from('audit_trail').insert([{
        user_id: actorName,
        action: action,
        detail: JSON.stringify({ memberId, memberName, ...changes, user_role: actorRole }),
        time: new Date().toISOString(),
        status: 'success',
      }]);
    }

    if (result.error) {
      throw result.error;
    }
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

const parseValidityAmount = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const match = raw.match(/(\d+)/);
  if (!match) return null;
  const amount = Number.parseInt(match[1], 10);
  return Number.isInteger(amount) && amount > 0 ? amount : null;
};

const computeExpirationDate = (joinDate, membershipValidity, monthlyValidity) => {
  const baseDate = new Date(joinDate);
  if (Number.isNaN(baseDate.getTime())) return null;

  const years = parseValidityAmount(membershipValidity);
  if (years) {
    const expiryDate = new Date(baseDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + years);
    return expiryDate.toISOString().split("T")[0];
  }

  const months = parseValidityAmount(monthlyValidity);
  if (months) {
    const expiryDate = new Date(baseDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);
    return expiryDate.toISOString().split("T")[0];
  }

  return null;
};

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
  requireAdminRole("add a member");

  const {
    fullName,
    email,
    phone,
    address,
    birthday,
    membershipType,
    monthlyValidity,
    membershipValidity,
    joinDate,
    gender,
    photo,
    emergencyContactName,
    emergencyContactNumber,
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

  // Default join date to today's date when not explicitly provided.
  const resolvedJoinDate = joinDate || new Date().toISOString().split("T")[0];

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
    expiration_date: computeExpirationDate(resolvedJoinDate, membershipValidity, monthlyValidity),
    gender: gender,
    photo_url: photoUrl,
    join_date: resolvedJoinDate,
    emergency_contact_name:   emergencyContactName   || null,
    emergency_contact_number: emergencyContactNumber || null,
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

  await logAuditTrail('Created member', data.member_id, data.full_name || '', {
    memberName: data.full_name || '',
    membership_type: data.membership_type || '',
    email: data.email || '',
  });

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
  try {
    const resp = await supabase
      .from("member")
      .select(
        "member_id, full_name, membership_type, email, phone, address, birthday, gender, photo_url, join_date, monthly_validity, membership_validity, expiration_date, emergency_contact_name, emergency_contact_number, created_at"
      )
      .order("created_at", { ascending: false });

    if (resp.error) throw resp.error;
    const data = resp.data || [];

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
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching members:", err);
    throw err;
  }
};

/**
 * Delete a member
 */
export const deleteMember = async (memberId, memberData = {}) => {
  requireAdminRole("delete a member");

  const { error } = await supabase
    .from("member")
    .delete()
    .eq("member_id", memberId);

  if (error) throw error;

  await logAuditTrail('Deleted member', memberId, memberData.full_name || '', {
    memberName: memberData.full_name || '',
    membership_type: memberData.membership_type || '',
  });
};

/**
 * Update member details
 */
export const updateMember = async (memberId, updates) => {
  requireAdminRole("update a member");

  // Fetch old data first to capture changes
  const { data: oldData, error: fetchError } = await supabase
    .from("member")
    .select('full_name, membership_type, email, phone, address, birthday, photo_url, emergency_contact_name, emergency_contact_number')
    .eq("member_id", memberId)
    .single();

  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from("member")
    .update(updates)
    .eq("member_id", memberId)
    .select();

  if (error) throw error;

  // Capture what changed
  const newRecord = data?.[0];
  const changes = {};

  if (oldData.full_name !== updates.full_name) {
    changes.full_name = { old: oldData.full_name, new: updates.full_name };
  }
  if (oldData.membership_type !== updates.membership_type) {
    changes.membership_type = { old: oldData.membership_type, new: updates.membership_type };
  }
  if (oldData.email !== updates.email) {
    changes.email = { old: oldData.email, new: updates.email };
  }
  if (oldData.phone !== updates.phone) {
    changes.phone = { old: oldData.phone, new: updates.phone };
  }
  if (oldData.address !== updates.address) {
    changes.address = { old: oldData.address, new: updates.address };
  }
  if (oldData.birthday !== updates.birthday) {
    changes.birthday = { old: oldData.birthday, new: updates.birthday };
  }
  if (oldData.emergency_contact_name !== updates.emergency_contact_name) {
    changes.emergency_contact_name = { old: oldData.emergency_contact_name, new: updates.emergency_contact_name };
  }
  if (oldData.emergency_contact_number !== updates.emergency_contact_number) {
    changes.emergency_contact_number = { old: oldData.emergency_contact_number, new: updates.emergency_contact_number };
  }
  if ('photo_url' in updates && oldData.photo_url !== updates.photo_url) {
    if (updates.photo_url) {
      changes.photo = { old: 'Previous photo', new: 'Updated photo' };
    } else {
      changes.photo = { old: 'Had photo', new: 'Photo removed' };
    }
  }

  await logAuditTrail('Updated member', memberId, newRecord?.full_name || '', changes);
  // Ensure returned record contains a usable photo URL (signed or public)
  if (newRecord && newRecord.photo_url) {
    try {
      const accessUrl = await getPhotoAccessUrl(newRecord.photo_url);
      newRecord.photo_url = accessUrl || newRecord.photo_url;
    } catch (err) {
      // If conversion fails, leave the stored value so caller can handle it
      // eslint-disable-next-line no-console
      console.warn('Failed to convert photo_url to access URL', err);
    }
  }

  return newRecord || null;
};

export const updateMemberMembership = async (memberId, updates) => {
  requireAdminRole("update a member membership");

  const { data: oldData, error: fetchError } = await supabase
    .from("member")
    .select('full_name, monthly_validity, membership_validity, expiration_date, join_date')
    .eq("member_id", memberId)
    .single();

  if (fetchError) throw fetchError;

  const currentJoinDate = updates.joinDate || new Date().toISOString().split("T")[0];
  const payload = {
    monthly_validity: updates.monthlyValidity || null,
    membership_validity: updates.membershipValidity || null,
    expiration_date: updates.cancelMembership
      ? null
      : computeExpirationDate(currentJoinDate, updates.membershipValidity, updates.monthlyValidity),
  };

  const { data, error } = await supabase
    .from("member")
    .update(payload)
    .eq("member_id", memberId)
    .select()
    .single();

  if (error) throw error;

  const newExpirationDate = data?.expiration_date || null;
  const changes = {
    monthly_validity: {
      old: oldData.monthly_validity || null,
      new: payload.monthly_validity,
    },
    membership_validity: {
      old: oldData.membership_validity || null,
      new: payload.membership_validity,
    },
    expiration_date: {
      old: oldData.expiration_date || null,
      new: newExpirationDate,
    },
  };

  await logAuditTrail('Updated member membership', memberId, oldData.full_name || '', changes);

  return data || null;
};