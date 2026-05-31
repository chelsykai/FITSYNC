import { useState, useRef, useEffect, useCallback } from "react";
import styles from "../Modal.module.css";
import { addMember } from "../../../services/memberService";

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const defaultForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  birthday: "",
  membershipType: "Student",
  monthlyValidity: "",
  membershipValidity: "",
  joinDate: getTodayDateString(),
  gender: "Male",
  photo: null,
  emergencyContactName: "",
  emergencyContactNumber: "",
};

function PhoneInput({ value, onChange }) {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    onChange(raw);
  };
  return (
    <div style={{
      display: "flex", alignItems: "center",
      border: "1px solid #ddd", borderRadius: 8,
      overflow: "hidden", background: "#fff",
      fontFamily: "Montserrat, sans-serif",
    }}>
      <span style={{
        padding: "8px 10px", background: "#f4f9f1",
        borderRight: "1px solid #ddd", fontSize: 12,
        fontWeight: 700, color: "#2e7d32", whiteSpace: "nowrap",
        flexShrink: 0,
      }}>+63</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="9XXXXXXXXX"
        value={value}
        onChange={handleChange}
        maxLength={10}
        style={{
          flex: 1, border: "none", outline: "none",
          padding: "8px 10px", fontSize: 12,
          fontFamily: "Montserrat, sans-serif", color: "#333",
          background: "transparent",
        }}
      />
    </div>
  );
}

export default function AddMemberModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const fileRef = useRef();
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const cameraStreamRef = useRef(null);

  useEffect(() => {
    const previewUrl = preview;
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [preview]);

  useEffect(() => {
    if (!cameraOpen) return undefined;
    const stream = cameraStreamRef.current;
    const videoElement = cameraVideoRef.current;
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        if (cameraStreamRef.current === stream) cameraStreamRef.current = null;
      }
      if (videoElement) videoElement.srcObject = null;
    };
  }, [cameraOpen]);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
  }, []);

  const closeCamera = useCallback(() => {
    stopCamera();
    setCameraOpen(false);
    setCameraLoading(false);
  }, [stopCamera]);

  const handleModalClose = useCallback(() => {
    closeCamera();
    onClose();
  }, [closeCamera, onClose]);

  const openCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported in this browser.");
      return;
    }
    try {
      setCameraLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
      window.requestAnimationFrame(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play?.().catch(() => {});
        }
      });
    } catch (err) {
      setCameraError(err?.message || "Unable to open the camera.");
      closeCamera();
    } finally {
      setCameraLoading(false);
    }
  };

  const captureCameraPhoto = async () => {
    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setCameraError("Camera is not ready yet.");
      return;
    }
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) { setCameraError("Unable to process the captured image."); return; }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(video, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) { setCameraError("Unable to capture a photo from the camera."); return; }
    const capturedFile = new File([blob], `member-camera-${Date.now()}.png`, {
      type: "image/png", lastModified: Date.now(),
    });
    if (preview) URL.revokeObjectURL(preview);
    setError(null);
    setCameraError(null);
    setForm((prev) => ({ ...prev, photo: capturedFile }));
    setPreview(URL.createObjectURL(capturedFile));
    closeCamera();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setNumber = (field) => (e) => {
    const nextValue = e.target.value;
    if (nextValue === "") { setForm({ ...form, [field]: "" }); return; }
    const sanitized = nextValue.replace(/[^\d]/g, "");
    setForm({ ...form, [field]: sanitized });
  };
  const resetMembershipPlan = () => {
    setForm((prev) => ({ ...prev, monthlyValidity: "", membershipValidity: "" }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Photo size must be 5MB or less."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setError(null);
    setForm((prev) => ({ ...prev, photo: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim()) { setError("Full name is required"); return; }
    setLoading(true);
    setError(null);
    try {
      const monthlyValidityMonths = Number.parseInt(form.monthlyValidity, 10);
      const membershipValidityYears = Number.parseInt(form.membershipValidity, 10);
      const hasMonthlyPlan = Number.isInteger(monthlyValidityMonths) && monthlyValidityMonths > 0;
      const hasYearlyMembership = Number.isInteger(membershipValidityYears) && membershipValidityYears > 0;
      if (!hasMonthlyPlan && !hasYearlyMembership) {
        setError("Please enter at least one plan: Months or Years.");
        setLoading(false);
        return;
      }
      const payload = {
        ...form,
        monthlyValidity: hasMonthlyPlan ? `${monthlyValidityMonths} Month${monthlyValidityMonths === 1 ? "" : "s"}` : "",
        membershipValidity: hasYearlyMembership ? `${membershipValidityYears} Year${membershipValidityYears === 1 ? "" : "s"}` : "",
        joinDate: form.joinDate || getTodayDateString(),
        emergencyContactName: form.emergencyContactName || "",
        emergencyContactNumber: form.emergencyContactNumber || "",
      };
      const newMember = await addMember(payload);
      onSuccess?.(newMember);
      setForm({ ...defaultForm, joinDate: getTodayDateString() });
      setPreview(null);
    } catch (err) {
      setError(err.message || "Failed to add member. Please try again.");
      console.error("Error adding member:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthdayStr) => {
  if (!birthdayStr) return null;
  const today = new Date();
  const birth = new Date(birthdayStr);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

  return (
    <div className={styles.overlay} onClick={handleModalClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 720,
          maxHeight: "90vh",
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.16)",
          fontFamily: "Montserrat, sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(160deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%)",
          padding: "22px 28px",
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Montserrat, sans-serif" }}>
            Add New Member
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
            Fill in the details below to register a new member.
          </p>
        </div>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left — photo section */}
          <div style={{
            width: 180,
            flexShrink: 0,
            background: "#f4f9f1",
            borderRight: "1px solid #ddebd4",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "28px 16px",
            gap: 12,
          }}>
            {/* Photo box */}
            <div
              onClick={() => fileRef.current.click()}
              style={{
                width: 110,
                height: 110,
                borderRadius: 12,
                background: "#e0edd8",
                border: "2px dashed #9dc47a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              {preview
                ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 32 }}>🖼️+</span>
              }
            </div>

            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#5d7a52", textAlign: "center", letterSpacing: "0.3px", textTransform: "uppercase" }}>
              Take or upload photo
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              <button
                type="button"
                onClick={openCamera}
                disabled={cameraLoading}
                style={{
                  border: "1px solid #c4d1bb", background: "#fff", color: "#3f5234",
                  borderRadius: 8, padding: "8px 0", fontSize: 11, fontWeight: 700,
                  fontFamily: "Montserrat, sans-serif", cursor: "pointer", width: "100%",
                }}
              >
                {cameraLoading ? "Opening..." : "📷 Camera"}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  border: "1px solid #c4d1bb", background: "#fff", color: "#3f5234",
                  borderRadius: 8, padding: "8px 0", fontSize: 11, fontWeight: 700,
                  fontFamily: "Montserrat, sans-serif", cursor: "pointer", width: "100%",
                }}
              >
                📁 Choose File
              </button>
            </div>

            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              style={{ display: "none" }} onChange={handlePhoto} />

            {cameraError && (
              <div style={{ color: "#d32f2f", fontSize: 10, padding: "6px 8px", backgroundColor: "#ffebee", borderRadius: 6, textAlign: "left", width: "100%" }}>
                {cameraError}
              </div>
            )}

            {cameraOpen && (
              <div style={{ width: "100%", padding: 8, borderRadius: 12, border: "1px solid #dfe8d6", background: "#f8fbf5" }}>
                <video ref={cameraVideoRef} autoPlay playsInline muted
                  style={{ width: "100%", borderRadius: 8, background: "#111" }} />
                <canvas ref={cameraCanvasRef} style={{ display: "none" }} />
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button type="button" onClick={captureCameraPhoto}
                    style={{ flex: 1, border: "1px solid #c4d1bb", background: "#fff", color: "#3f5234", borderRadius: 6, padding: "6px 0", fontSize: 10, fontWeight: 700, fontFamily: "Montserrat, sans-serif", cursor: "pointer" }}>
                    Capture
                  </button>
                  <button type="button" onClick={closeCamera}
                    style={{ flex: 1, border: "1px solid #c4d1bb", background: "#fff", color: "#3f5234", borderRadius: 6, padding: "6px 0", fontSize: 10, fontWeight: 700, fontFamily: "Montserrat, sans-serif", cursor: "pointer" }}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right — form fields */}
          <div className={styles.addMemberFields}>
            <div className={styles.fieldRow}>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Full Name</label>
                <input className={styles.formInput} placeholder="Enter full name"
                  value={form.fullName} onChange={set("fullName")} />
              </div>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Email Address</label>
                <input className={styles.formInput} placeholder="name@email.com" type="email"
                  value={form.email} onChange={set("email")} />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Phone Number</label>
                <div className={styles.phoneInputWrap}>
                  <span className={styles.phonePrefix}>+63</span>
                  <input className={styles.formInput} placeholder="9XX XXX XXXX" 
                    value={form.phone} onChange={set("phone")} />
                </div>
              </div>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Address</label>
                <input className={styles.formInput} placeholder="Street, City"
                  value={form.address} onChange={set("address")} />
              </div>
            </div>
                <div className={styles.labeledField}>
                  <label className={styles.modernLabel}>Birthday</label>
                  <input className={styles.formInput} type="date"
                   value={form.birthday} onChange={set("birthday")} />
                   {form.birthday && calculateAge(form.birthday) !== null && (
                  <span style={{fontSize: 11,fontWeight: 700,color: "#7eba56",marginTop: 4,display: "block"
                     }}> Age: {calculateAge(form.birthday)} years old</span> )}
                </div>
            <div className={styles.membershipSettings}>
              <p className={styles.membershipSettingsTitle}>Membership Settings</p>
=              <div className={styles.fieldRow}>
                <div className={styles.labeledField}>
                  <label className={styles.modernLabel}>Member Type</label>
                  <select className={styles.formInput} value={form.membershipType} onChange={set("membershipType")}>
                    {["Student", "Regular", "Senior", "PWD"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div className={styles.unitInputWrap}>
                    <input className={styles.formInput} placeholder="Plan Duration" type="number" min="1" step="1"
                      inputMode="numeric" value={form.monthlyValidity} onChange={setNumber("monthlyValidity")} />
                    <span className={styles.unitSuffix}>Months</span>
                    <p className={styles.inputContextLabel}>Plan Duration (Months)</p>
                  </div>
                  <div className={styles.unitInputWrap}>
                    <input className={styles.formInput} placeholder="Membership Term" type="number" min="0" step="1"
                      inputMode="numeric" value={form.membershipValidity} onChange={setNumber("membershipValidity")} />
                    <span className={styles.unitSuffix}>Years</span>
                    <p className={styles.inputContextLabel}>Membership Term (Years)</p>
                  </div>
                </div>
                <div>
                  <button type="button" className={styles.planResetBtn} onClick={resetMembershipPlan}
                    disabled={!form.monthlyValidity && !form.membershipValidity}>
                    Reset Plan Selection
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #e8f0e4" }} />

            {/* Emergency Contact */}
            <div className={styles.fieldRow}>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Emergency Contact Name</label>
                <input className={styles.formInput} placeholder="Contact person name"
                  value={form.emergencyContactName} onChange={set("emergencyContactName")} />
              </div>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Emergency Contact Number</label>
                <div className={styles.phoneInputWrap}>
                  <span className={styles.phonePrefix}>+63</span>
                  <input className={styles.formInput} placeholder="9XX XXX XXXX" 
                    value={form.emergencyContactNumber} onChange={set("emergencyContactNumber")} />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ color: "#d32f2f", fontSize: 12, padding: "8px 12px", backgroundColor: "#ffebee", borderRadius: 6 }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer buttons ── */}
        <div style={{
          display: "flex", gap: 12, padding: "16px 28px",
          borderTop: "1px solid #e8f0e4", flexShrink: 0, background: "#fff",
        }}>
          <button onClick={handleModalClose} disabled={loading} style={{
            flex: 1, padding: 11, background: "#333", color: "#fff", border: "none",
            borderRadius: 8, fontFamily: "Montserrat, sans-serif", fontWeight: 700,
            fontSize: 13, cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: 11, background: "#2e7d32", color: "#fff", border: "none",
            borderRadius: 8, fontFamily: "Montserrat, sans-serif", fontWeight: 700,
            fontSize: 13, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "Adding Member..." : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#5d6f53", letterSpacing: "0.28px", textTransform: "uppercase", fontFamily: "Montserrat, sans-serif" }}>
        {label}
      </label>
      {children}
    </div>
  );
}