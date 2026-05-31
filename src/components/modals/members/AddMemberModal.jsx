import { useState, useRef, useEffect, useCallback } from "react";
import styles from "../Modal.module.css";
import { addMember } from "../../../services/memberService";

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const defaultForm = {
  fullName:             "",
  email:                "",
  phone:                "",
  address:              "",
  birthday:             "",
  membershipType:       "Student",
  monthlyValidity:      "",
  membershipValidity:   "",
  joinDate:             getTodayDateString(),
  gender:               "Male",
  photo:                null,
  emergencyContactName:   "",
  emergencyContactNumber: "",
};

export default function AddMemberModal({ onClose, onSuccess }) {
  const [form,          setForm]          = useState(defaultForm);
  const [preview,       setPreview]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [cameraOpen,    setCameraOpen]    = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError,   setCameraError]   = useState(null);

  const fileRef        = useRef();
  const cameraVideoRef  = useRef(null);
  const cameraCanvasRef = useRef(null);
  const cameraStreamRef = useRef(null);

  /* ── Cleanup preview URL ── */
  useEffect(() => {
    const url = preview;
    return () => { if (url?.startsWith("blob:")) URL.revokeObjectURL(url); };
  }, [preview]);

  /* ── Cleanup camera stream on unmount ── */
  useEffect(() => {
    if (!cameraOpen) return undefined;
    const stream      = cameraStreamRef.current;
    const videoEl     = cameraVideoRef.current;
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        if (cameraStreamRef.current === stream) cameraStreamRef.current = null;
      }
      if (videoEl) videoEl.srcObject = null;
    };
  }, [cameraOpen]);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
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

  /* ── Camera ── */
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
    const video  = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setCameraError("Camera is not ready yet.");
      return;
    }
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setCameraError("Unable to process the captured image."); return; }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) { setCameraError("Unable to capture a photo from the camera."); return; }
    const file = new File([blob], `member-camera-${Date.now()}.png`, {
      type: "image/png", lastModified: Date.now(),
    });
    if (preview) URL.revokeObjectURL(preview);
    setError(null);
    setCameraError(null);
    setForm((prev) => ({ ...prev, photo: file }));
    setPreview(URL.createObjectURL(file));
    closeCamera();
  };

  /* ── Form helpers ── */
  const set       = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setNumber = (field) => (e) => {
    const v = e.target.value;
    setForm({ ...form, [field]: v === "" ? "" : v.replace(/[^\d]/g, "") });
  };
  const resetMembershipPlan = () =>
    setForm((prev) => ({ ...prev, monthlyValidity: "", membershipValidity: "" }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024)    { setError("Photo size must be 5 MB or less."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setError(null);
    setForm((prev) => ({ ...prev, photo: file }));
    setPreview(URL.createObjectURL(file));
  };

  const calculateAge = (birthdayStr) => {
    if (!birthdayStr) return null;
    const today = new Date();
    const birth = new Date(birthdayStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!form.fullName.trim()) { setError("Full name is required."); return; }
    const months = Number.parseInt(form.monthlyValidity, 10);
    const years  = Number.parseInt(form.membershipValidity, 10);
    const hasMonths = Number.isInteger(months) && months > 0;
    const hasYears  = Number.isInteger(years)  && years  > 0;
    if (!hasMonths && !hasYears) {
      setError("Please enter at least one plan: Months or Years.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        monthlyValidity:    hasMonths ? `${months} Month${months === 1 ? "" : "s"}` : "",
        membershipValidity: hasYears  ? `${years}  Year${years  === 1 ? "" : "s"}` : "",
        joinDate:           form.joinDate || getTodayDateString(),
      };
      const newMember = await addMember(payload);
      onSuccess?.(newMember);
      setForm({ ...defaultForm, joinDate: getTodayDateString() });
      setPreview(null);
    } catch (err) {
      setError(err.message || "Failed to add member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const age = calculateAge(form.birthday);

  /* ──────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────── */
  return (
    <div className={styles.overlay} onClick={handleModalClose}>
      <div className={styles.addMemberModal} onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.addMemberHeader}>
          <h2 className={styles.addMemberTitle}>Add New Member</h2>
          <p className={styles.addMemberSubtitle}>
            Fill in the details below to register a new member.
          </p>
        </div>

        {/* ── Body ── */}
        <div className={styles.addMemberBody}>

          {/* Left — photo panel */}
          <div className={styles.photoSection}>
            {/* Photo box */}
            <div
              className={styles.photoBox}
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Member preview" className={styles.photoPreview} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <i className="ti ti-user-circle" style={{ fontSize: 36, color: "#9dc47a" }} />
                </div>
              )}
            </div>

            <p className={styles.uploadLabel}>Take or Upload Photo</p>

            <button
              type="button"
              className={styles.photoActionBtn}
              onClick={openCamera}
              disabled={cameraLoading}
            >
              <i className="ti ti-camera" />
              {cameraLoading ? "Opening…" : "Camera"}
            </button>

            <button
              type="button"
              className={styles.photoActionBtn}
              onClick={() => fileRef.current?.click()}
            >
              <i className="ti ti-folder-open" />
              Choose File
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handlePhoto}
            />

            {cameraError && (
              <div className={styles.formError} style={{ fontSize: 11 }}>{cameraError}</div>
            )}

            {/* Camera live preview */}
            {cameraOpen && (
              <div className={styles.cameraPreviewWrap}>
                <video
                  ref={cameraVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={styles.cameraVideo}
                />
                <canvas ref={cameraCanvasRef} style={{ display: "none" }} />
                <div className={styles.cameraBtnRow}>
                  <button type="button" className={styles.photoActionBtn} onClick={captureCameraPhoto}>
                    <i className="ti ti-camera" /> Capture
                  </button>
                  <button type="button" className={styles.photoActionBtn} onClick={closeCamera}>
                    <i className="ti ti-x" /> Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right — form fields */}
          <div className={styles.addMemberFields}>

            {/* Row 1: Name + Email */}
            <div className={styles.fieldRow}>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Full Name</label>
                <input
                  className={styles.formInput}
                  placeholder="Enter full name"
                  value={form.fullName}
                  onChange={set("fullName")}
                />
              </div>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Email Address</label>
                <input
                  className={styles.formInput}
                  type="email"
                  placeholder="name@email.com"
                  value={form.email}
                  onChange={set("email")}
                />
              </div>
            </div>

            {/* Row 2: Phone + Address */}
            <div className={styles.fieldRow}>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Phone Number</label>
                <div className={styles.phoneInputWrap}>
                  <span className={styles.phonePrefix}>+63</span>
                  <input
                    className={styles.formInput}
                    type="text"
                    inputMode="numeric"
                    placeholder="9XXXXXXXXX"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value.replace(/[^\d]/g, "") })
                    }
                  />
                </div>
              </div>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Address</label>
                <input
                  className={styles.formInput}
                  placeholder="Street, City"
                  value={form.address}
                  onChange={set("address")}
                />
              </div>
            </div>

            {/* Row 3: Birthday + Gender */}
            <div className={styles.fieldRow}>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>
                  Birthday{age !== null ? ` · Age ${age}` : ""}
                </label>
                <input
                  className={styles.formInput}
                  type="date"
                  value={form.birthday}
                  onChange={set("birthday")}
                />
              </div>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Gender</label>
                <div className={styles.genderRow}>
                  {["Male", "Female", "Other"].map((g) => (
                    <label key={g} className={styles.genderOption}>
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={form.gender === g}
                        onChange={set("gender")}
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Membership settings box */}
            <div className={styles.membershipSettings}>
              <div className={styles.msHeader}>
                <div className={styles.msIcon}>
                  <i className="ti ti-id-badge" />
                </div>
                <div>
                  <p className={styles.membershipSettingsTitle}>Membership Settings</p>
                  <p className={styles.membershipSettingsHint}>Set member type and plan duration</p>
                </div>
              </div>

              <div className={styles.msDivider} />

              {/* Member type */}
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Member Type</label>
                <select
                  className={styles.formInput}
                  value={form.membershipType}
                  onChange={set("membershipType")}
                >
                  {["Student", "Regular", "Senior", "PWD"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Plan cards */}
              <p className={styles.planSectionLabel}>Plan Duration</p>
              <div className={styles.planGrid}>
                <div className={`${styles.planCard} ${form.monthlyValidity ? styles.planCardActive : ""}`}>
                  <div className={styles.planCardHeader}>
                    <div className={`${styles.planCardDot} ${form.monthlyValidity ? styles.planCardDotActive : ""}`} />
                    <div>
                      <p className={styles.planCardName}>Monthly Plan</p>
                      <p className={styles.planCardDesc}>Billed per month</p>
                    </div>
                  </div>
                  <div className={styles.planCardInputWrap}>
                    <input
                      className={styles.planCardInput}
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      placeholder="0"
                      value={form.monthlyValidity}
                      onChange={setNumber("monthlyValidity")}
                    />
                    <span className={styles.planCardUnit}>Months</span>
                  </div>
                </div>

                <div className={`${styles.planCard} ${form.membershipValidity ? styles.planCardActive : ""}`}>
                  <div className={styles.planCardHeader}>
                    <div className={`${styles.planCardDot} ${form.membershipValidity ? styles.planCardDotActive : ""}`} />
                    <div>
                      <p className={styles.planCardName}>Yearly Membership</p>
                      <p className={styles.planCardDesc}>Annual term</p>
                    </div>
                  </div>
                  <div className={styles.planCardInputWrap}>
                    <input
                      className={styles.planCardInput}
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      placeholder="0"
                      value={form.membershipValidity}
                      onChange={setNumber("membershipValidity")}
                    />
                    <span className={styles.planCardUnit}>Years</span>
                  </div>
                </div>
              </div>

              <div className={styles.msResetRow}>
                <button
                  type="button"
                  className={styles.planResetBtn}
                  onClick={resetMembershipPlan}
                  disabled={!form.monthlyValidity && !form.membershipValidity}
                >
                  <i className="ti ti-rotate" /> Reset Plan
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #e8f0e4" }} />

            {/* Emergency Contact */}
            <div className={styles.fieldRow}>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Emergency Contact Name</label>
                <input
                  className={styles.formInput}
                  placeholder="Contact person name"
                  value={form.emergencyContactName}
                  onChange={set("emergencyContactName")}
                />
              </div>
              <div className={styles.labeledField}>
                <label className={styles.modernLabel}>Emergency Contact Number</label>
                <input
                  className={styles.formInput}
                  placeholder="09XXXXXXXXX"
                  value={form.emergencyContactNumber}
                  onChange={set("emergencyContactNumber")}
                />
              </div>
            </div>

            {/* Error */}
            {error && <div className={styles.formError}>{error}</div>}

          </div>
        </div>

        {/* ── Footer ── */}
        <div className={styles.addMemberBtns}>
          <button
            className={styles.addMemberCancelBtn}
            onClick={handleModalClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.addMemberSubmitBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            <i className={`ti ${loading ? "ti-loader-2" : "ti-user-plus"}`} />
            {loading ? "Adding Member…" : "Add Member"}
          </button>
        </div>

      </div>
    </div>
  );
}