import { useState, useRef } from "react";
import styles from "../Modal.module.css";
import { updateMember, uploadMemberPhoto } from "../../../services/memberService";
import ReAuthModal from "../../ReAuthModal";

export default function EditMemberModal({ member, onClose, onSave }) {
  const photoInputRef = useRef(null);
  const [form, setForm] = useState({
    firstName:       (member.full_name?.split(" ")[0]) || "",
    lastName:        (member.full_name?.split(" ").slice(1).join(" ")) || "",
    member_id:       member.member_id || "",
    membership_type: member.membership_type || "",
    birthday:        member.birthday || "",
    address:         member.address || "",
    phone:           member.phone || "",
    email:           member.email || "",
    emergencyContactName:   member.emergency_contact_name   || "",
    emergencyContactNumber: member.emergency_contact_number || "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(member.photo_url || null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [showReAuth, setShowReAuth] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSaveClick = () => setShowReAuth(true);

  const handleReAuthSuccess = async () => {
    setShowReAuth(false);
    try {
      setLoading(true);
      setError(null);
      
      // Only include fields that should be updated
      const updates = {};
      
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      if (fullName !== member.full_name) updates.full_name = fullName;
      
      if (form.membership_type !== member.membership_type) updates.membership_type = form.membership_type;
      if (form.birthday !== member.birthday) updates.birthday = form.birthday || null;
      if (form.address !== member.address) updates.address = form.address || null;
      if (form.phone !== member.phone) updates.phone = form.phone || null;
      if (form.email !== member.email) updates.email = form.email || null;
      if (form.emergencyContactName   !== (member.emergency_contact_name   || '')) updates.emergency_contact_name   = form.emergencyContactName   || null;
      if (form.emergencyContactNumber !== (member.emergency_contact_number || '')) updates.emergency_contact_number = form.emergencyContactNumber || null;

      // Upload photo only if a new one was selected
      if (photoFile) {
        const photoUrl = await uploadMemberPhoto(photoFile, member.member_id);
        updates.photo_url = photoUrl;
      }

      // Remove photo if it was explicitly cleared
      if (photoPreview === null && member.photo_url) {
        updates.photo_url = null;
      }

      // Only call updateMember if there are actual changes
      if (Object.keys(updates).length === 0) {
        alert("No changes made");
        onClose();
        return;
      }

      const updatedMember = await updateMember(member.member_id, updates);
      onSave?.(updatedMember);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save changes");
      console.error("Error saving member:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.modalTitle}>Edit Member</h2>

          {error && (
            <div style={{ color:"#d32f2f", backgroundColor:"#ffebee", padding:"12px", borderRadius:"4px", marginBottom:"16px", fontSize:"14px" }}>
              {error}
            </div>
          )}

          <div className={styles.formGrid}>
            {/* Photo Upload - Full Width */}
            <div className={styles.formGroupFull}>
              <label className={styles.formLabel}>Photo</label>
              <div style={{
                width: '100%',
                height: '140px',
                borderRadius: '50%',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '2px solid #ddd',
                marginTop: '8px',
                cursor: 'pointer',
                margin: '8px auto',
                maxWidth: '140px'
              }} onClick={() => photoInputRef.current?.click()}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '48px' }}>📷</span>
                )}
              </div>
              <button
                className={styles.formInput}
                onClick={handleRemovePhoto}
                style={{ marginTop: '8px', padding: '8px', cursor: 'pointer', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', color: '#d32f2f' }}
              >
                Remove Photo
              </button>
              <button
                className={styles.formInput}
                onClick={() => photoInputRef.current?.click()}
                style={{ marginTop: '8px', padding: '8px', cursor: 'pointer', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
              >
                Choose Photo
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Form Fields */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>First Name</label>
              <input className={styles.formInput} placeholder="First Name" value={form.firstName} onChange={set("firstName")} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Last Name</label>
              <input className={styles.formInput} placeholder="Last Name" value={form.lastName} onChange={set("lastName")} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Member ID</label>
              <input className={styles.formInput} value={form.member_id} disabled />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Membership Type</label>
              <select className={styles.formInput} value={form.membership_type} onChange={set("membership_type")}>
                <option value="">Select Type</option>
                {["Student","Regular","Senior","PWD"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Birthday</label>
              <input className={styles.formInput} type="date" value={form.birthday} onChange={set("birthday")} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone Number</label>
              <input className={styles.formInput} placeholder="09XXXXXXXXX" value={form.phone} onChange={set("phone")} />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.formLabel}>Address</label>
              <input className={styles.formInput} placeholder="Address" value={form.address} onChange={set("address")} />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.formLabel}>Email</label>
              <input className={styles.formInput} placeholder="email@example.com" type="email" value={form.email} onChange={set("email")} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Emergency Contact Name</label>
              <input className={styles.formInput} placeholder="Contact person name"
                value={form.emergencyContactName} onChange={set("emergencyContactName")} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Emergency Contact Number</label>
              <input className={styles.formInput} placeholder="09XXXXXXXXX"
                value={form.emergencyContactNumber} onChange={set("emergencyContactNumber")} />
            </div>
          </div>

          <button className={styles.submitBtn} onClick={handleSaveClick} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button className={styles.closeBtn} onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>

      {showReAuth && (
        <ReAuthModal
          actionLabel="save member changes"
          onSuccess={handleReAuthSuccess}
          onClose={() => setShowReAuth(false)}
        />
      )}
    </>
  );
}