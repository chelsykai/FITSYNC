import { useState, useRef, useEffect } from "react";
import styles from "../Modal.module.css";
import { addMember } from "../../../services/memberService";

const defaultForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  birthday: "",
  membershipType: "Student",
  monthlyValidity: "",
  membershipValidity: "",
  gender: "Male",
  photo: null,
};

export default function AddMemberModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setError("Photo size must be 5MB or less.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setError(null);
    setForm({ ...form, photo: file });
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim()) {
      setError("Full name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newMember = await addMember(form);
      onSuccess?.(newMember);
      setForm(defaultForm);
      setPreview(null);
    } catch (err) {
      setError(err.message || "Failed to add member. Please try again.");
      console.error("Error adding member:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.addMemberModal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.addMemberTitle}>Add New Member</h2>

        <div className={styles.addMemberBody}>
          {/* Left — photo upload */}
          <div className={styles.photoSection}>
            <div className={styles.photoBox} onClick={() => fileRef.current.click()}>
              {preview
                ? <img src={preview} alt="preview" className={styles.photoPreview} />
                : <div className={styles.photoPlaceholder}>
                    <span className={styles.photoIcon}>🖼️+</span>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
            <p className={styles.uploadLabel}>Upload Photo</p>
          </div>

          {/* Right — form fields */}
          <div className={styles.addMemberFields}>
            <div className={styles.fieldRow}>
              <input className={styles.formInput} placeholder="Full Name"
                value={form.fullName} onChange={set("fullName")} />
              <input className={styles.formInput} placeholder="Email Address" type="email"
                value={form.email} onChange={set("email")} />
            </div>
            <div className={styles.fieldRow}>
              <input className={styles.formInput} placeholder="Phone Number"
                value={form.phone} onChange={set("phone")} />
              <input className={styles.formInput} placeholder="Address"
                value={form.address} onChange={set("address")} />
            </div>
            <div className={styles.fieldRow}>
              <input className={styles.formInput} placeholder="Birthday" type="date"
                value={form.birthday} onChange={set("birthday")} />
              <select className={styles.formInput} value={form.membershipType} onChange={set("membershipType")}>
                {["Student", "Regular", "Senior", "PWD"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className={styles.fieldRow}>
              <input className={styles.formInput} placeholder="Monthly Validity (e.g. 1 month)"
                value={form.monthlyValidity} onChange={set("monthlyValidity")} />
              <input className={styles.formInput} placeholder="Membership Validity (e.g. 1 Year)"
                value={form.membershipValidity} onChange={set("membershipValidity")} />
            </div>

            {/* Gender */}
            <div className={styles.genderRow}>
              <label className={styles.genderOption}>
                <input type="radio" name="gender" value="Male"
                  checked={form.gender === "Male"} onChange={set("gender")}
                  style={{ accentColor: "#7eba56" }} />
                Male
              </label>
              <label className={styles.genderOption}>
                <input type="radio" name="gender" value="Female"
                  checked={form.gender === "Female"} onChange={set("gender")}
                  style={{ accentColor: "#7eba56" }} />
                Female
              </label>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                color: "#d32f2f",
                fontSize: "0.9rem",
                marginTop: "10px",
                padding: "8px",
                backgroundColor: "#ffebee",
                borderRadius: "4px",
              }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className={styles.addMemberBtns}>
          <button className={styles.addMemberCancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
          <button 
            className={styles.addMemberSubmitBtn} 
            onClick={handleSubmit}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Adding Member..." : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}
