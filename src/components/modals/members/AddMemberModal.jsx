import { useState, useRef } from "react";
import styles from "../Modal.module.css";

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
  const fileRef = useRef();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm({ ...form, photo: file });
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!form.fullName.trim()) return;
    const memberId = "FS-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0");
    onSuccess?.({ ...form, memberId });
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
          </div>
        </div>

        {/* Buttons */}
        <div className={styles.addMemberBtns}>
          <button className={styles.addMemberCancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.addMemberSubmitBtn} onClick={handleSubmit}>Add Member</button>
        </div>
      </div>
    </div>
  );
}
