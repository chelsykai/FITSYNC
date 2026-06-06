import { useState, useRef, useEffect, useCallback } from "react";
import styles from "../Modal.module.css";
import { updateMember, uploadMemberPhoto } from "../../../services/memberService";
import ReAuthModal from "../../ReAuthModal";

export default function EditMemberModal({ member, onClose, onSave }) {
  const photoInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    const previewUrl = photoPreview;
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [photoPreview]);

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

    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(capturedFile);
    setPhotoPreview(URL.createObjectURL(capturedFile));
    setCameraError(null);
    closeCamera();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
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
      <div className={styles.overlay} onClick={handleModalClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.modalTitle}>Edit Member</h2>

          {error && (
            <div style={{ color:"#d32f2f", backgroundColor:"#ffebee", padding:"12px", borderRadius:"4px", marginBottom:"16px", fontSize:"14px" }}>
              {error}
            </div>
          )}

          <div className={styles.formGrid}>
            {/* Photo Upload - Full Width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label className={styles.modernLabel}>Photo</label>
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
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className={styles.formInput}
                  onClick={openCamera}
                  type="button"
                  style={{ marginTop: '8px', padding: '8px', cursor: 'pointer', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
                  disabled={cameraLoading}
                >
                  {cameraLoading ? 'Opening Camera...' : 'Use Camera'}
                </button>
                <button
                  className={styles.formInput}
                  onClick={() => photoInputRef.current?.click()}
                  type="button"
                  style={{ marginTop: '8px', padding: '8px', cursor: 'pointer', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
                >
                  Choose Photo
                </button>
              </div>
              <button
                className={styles.formInput}
                onClick={handleRemovePhoto}
                type="button"
                style={{ marginTop: '8px', padding: '8px', cursor: 'pointer', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', color: '#d32f2f' }}
              >
                Remove Photo
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />

              {cameraError && (
                <div style={{ color:"#d32f2f", backgroundColor:"#ffebee", padding:"12px", borderRadius:"4px", marginTop:"12px", fontSize:"14px" }}>
                  {cameraError}
                </div>
              )}

              {cameraOpen && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '16px',
                  border: '1px solid #ddd',
                  backgroundColor: '#fafafa',
                }}>
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', borderRadius: '12px', backgroundColor: '#111', maxHeight: '320px' }}
                  />
                  <canvas ref={cameraCanvasRef} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <button
                      className={styles.formInput}
                      onClick={captureCameraPhoto}
                      type="button"
                      style={{ marginTop: '0', padding: '8px', cursor: 'pointer', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
                    >
                      Capture
                    </button>
                    <button
                      className={styles.formInput}
                      onClick={closeCamera}
                      type="button"
                      style={{ marginTop: '0', padding: '8px', cursor: 'pointer', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
                    >
                      Close Camera
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div>
              <label className={styles.modernLabel}>First Name</label>
              <input className={styles.formInput} placeholder="First Name" value={form.firstName} onChange={set("firstName")} />
            </div>
            <div>
              <label className={styles.modernLabel}>Last Name</label>
              <input className={styles.formInput} placeholder="Last Name" value={form.lastName} onChange={set("lastName")} />
            </div>
            <div>
              <label className={styles.modernLabel}>Member ID</label>
              <input className={styles.formInput} value={form.member_id} disabled />
            </div>
            <div>
              <label className={styles.modernLabel}>Membership Type</label>
              <select className={styles.formInput} value={form.membership_type} onChange={set("membership_type")}>
                <option value="">Select Type</option>
                {["Student","Regular","Senior","PWD"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={styles.modernLabel}>Birthday</label>
              <input className={styles.formInput} type="date" value={form.birthday} onChange={set("birthday")} />
            </div>
            <div>
              <label className={styles.modernLabel}>Phone Number</label>
              <input className={styles.formInput} placeholder="09XXXXXXXXX" value={form.phone} onChange={set("phone")} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className={styles.modernLabel}>Address</label>
              <input className={styles.formInput} placeholder="Address" value={form.address} onChange={set("address")} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className={styles.modernLabel}>Email</label>
              <input className={styles.formInput} placeholder="email@example.com" type="email" value={form.email} onChange={set("email")} />
            </div>
            <div>
              <label className={styles.modernLabel}>Emergency Contact Name</label>
              <input className={styles.formInput} placeholder="Contact person name"
                value={form.emergencyContactName} onChange={set("emergencyContactName")} />
            </div>
            <div>
              <label className={styles.modernLabel}>Emergency Contact Number</label>
              <input className={styles.formInput} placeholder="09XXXXXXXXX"
                value={form.emergencyContactNumber} onChange={set("emergencyContactNumber")} />
            </div>
          </div>

          <button className={styles.submitBtn} onClick={handleSaveClick} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button className={styles.closeBtn} onClick={handleModalClose} disabled={loading}>Cancel</button>
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