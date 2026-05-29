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
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (!cameraOpen) return undefined;

    const stream = cameraStreamRef.current;
    const videoElement = cameraVideoRef.current;

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        if (cameraStreamRef.current === stream) {
          cameraStreamRef.current = null;
        }
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [cameraOpen]);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
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
    if (!context) {
      setCameraError("Unable to process the captured image.");
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
      setCameraError("Unable to capture a photo from the camera.");
      return;
    }

    const capturedFile = new File([blob], `member-camera-${Date.now()}.png`, {
      type: "image/png",
      lastModified: Date.now(),
    });

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setError(null);
    setCameraError(null);
    setForm((prev) => ({ ...prev, photo: capturedFile }));
    setPreview(URL.createObjectURL(capturedFile));
    closeCamera();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setNumber = (field) => (e) => {
    const nextValue = e.target.value;
    if (nextValue === "") {
      setForm({ ...form, [field]: "" });
      return;
    }
    const sanitized = nextValue.replace(/[^\d]/g, "");
    setForm({ ...form, [field]: sanitized });
  };
  const resetMembershipPlan = () => {
    setForm((prev) => ({
      ...prev,
      monthlyValidity: "",
      membershipValidity: "",
    }));
  };

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
    setForm((prev) => ({ ...prev, photo: file }));
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
        monthlyValidity: hasMonthlyPlan
          ? `${monthlyValidityMonths} Month${monthlyValidityMonths === 1 ? "" : "s"}`
          : "",
        membershipValidity: hasYearlyMembership
          ? `${membershipValidityYears} Year${membershipValidityYears === 1 ? "" : "s"}`
          : "",
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

  return (
    <div className={styles.overlay} onClick={handleModalClose}>
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
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                <button type="button" className={styles.planResetBtn} onClick={openCamera} disabled={cameraLoading}>
                  {cameraLoading ? "Opening Camera..." : "Use Camera"}
                </button>
                <button type="button" className={styles.planResetBtn} onClick={() => fileRef.current?.click()}>
                  Choose File
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handlePhoto}
              />
              <p className={styles.uploadLabel}>Take or upload photo</p>

              {cameraError && (
                <div style={{
                  color: "#d32f2f",
                  fontSize: "0.9rem",
                  marginTop: "10px",
                  padding: "8px",
                  backgroundColor: "#ffebee",
                  borderRadius: "4px",
                  maxWidth: "220px",
                  textAlign: "left",
                }}>
                  {cameraError}
                </div>
              )}

              {cameraOpen && (
                <div style={{
                  marginTop: "12px",
                  width: "100%",
                  maxWidth: "260px",
                  padding: "12px",
                  borderRadius: "16px",
                  border: "1px solid #dfe8d6",
                  background: "#f8fbf5",
                }}>
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: "100%", borderRadius: "12px", background: "#111" }}
                  />
                  <canvas ref={cameraCanvasRef} style={{ display: "none" }} />
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                    <button type="button" className={styles.planResetBtn} onClick={captureCameraPhoto} disabled={cameraLoading}>
                      Capture
                    </button>
                    <button type="button" className={styles.planResetBtn} onClick={closeCamera}>
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
                <input className={styles.formInput} placeholder="09XXXXXXXXX"
                  value={form.phone} onChange={set("phone")} />
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
            </div>

            <div className={styles.membershipSettings}>
              <p className={styles.membershipSettingsTitle}>Membership Settings</p>

              <div className={styles.fieldRow}>
                <div className={styles.labeledField}>
                  <label className={styles.modernLabel}>Member Type</label>
                  <select className={styles.formInput} value={form.membershipType} onChange={set("membershipType")}>
                    {["Student", "Regular", "Senior", "PWD"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.unitInputWrap}>
                  <input
                    className={styles.formInput}
                    placeholder="Plan Duration"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.monthlyValidity}
                    onChange={setNumber("monthlyValidity")}
                  />
                  <span className={styles.unitSuffix}>Months</span>
                  <p className={styles.inputContextLabel}>Plan Duration (Months)</p>
                </div>
                <div className={styles.unitInputWrap}>
                  <input
                    className={styles.formInput}
                    placeholder="Membership Term"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={form.membershipValidity}
                    onChange={setNumber("membershipValidity")}
                  />
                  <span className={styles.unitSuffix}>Years</span>
                  <p className={styles.inputContextLabel}>Membership Term (Years)</p>
                </div>
              </div>
              <div className={styles.fieldRow}>
                <button
                  type="button"
                  className={styles.planResetBtn}
                  onClick={resetMembershipPlan}
                  disabled={!form.monthlyValidity && !form.membershipValidity}
                >
                  Reset Plan Selection
                </button>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className={styles.fieldRow}>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Emergency Contact Name</label>
                <input className={styles.formInput} placeholder="Contact person name"
                  value={form.emergencyContactName} onChange={set("emergencyContactName")} />
              </div>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Emergency Contact Number</label>
                <input className={styles.formInput} placeholder="09XXXXXXXXX"
                  value={form.emergencyContactNumber} onChange={set("emergencyContactNumber")} />
              </div>
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
          <button className={styles.addMemberCancelBtn} onClick={handleModalClose} disabled={loading}>Cancel</button>
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