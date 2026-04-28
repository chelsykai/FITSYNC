import { useEffect, useRef, useState } from "react";
import styles from "./ScannerPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import { fetchMembers } from "../../services/memberService";
import { recordMemberAttendance } from "../../services/attendanceService";
import { Html5Qrcode } from "html5-qrcode";

export default function ScannerPage({ onNavigate, activePage = "scanner" }) {
  const scannerRef = useRef(null);
  const membersRef = useRef([]);
  const scannerInstanceRef = useRef(null);
  const audioContextRef = useRef(null);
  const lastScanRef = useRef({ id: "", at: 0 });
  const fadeTimerRef = useRef(null);
  const clearTimerRef = useRef(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [scannerState, setScannerState] = useState("idle");
  const [scannerMessage, setScannerMessage] = useState(
    "Click Start Camera to begin scanning a member QR code."
  );
  const [scanHighlightMember, setScanHighlightMember] = useState(null);
  const [scanHighlightVisible, setScanHighlightVisible] = useState(false);

  const formatCameraError = (err) => {
    const name = err?.name || "CameraError";
    const message = err?.message || "Unknown camera error";

    if (typeof window !== "undefined" && !window.isSecureContext) {
      return "This page is not running in a secure context. Use localhost (http://localhost) or HTTPS.";
    }

    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "Camera permission was denied. Allow camera access in the browser and reload the page.";
    }

    if (name === "NotFoundError") {
      return "No camera was found on this device.";
    }

    if (name === "NotReadableError") {
      return "The camera is already in use by another app or browser tab.";
    }

    if (name === "SecurityError") {
      return "Camera access is blocked by the browser or operating system security settings.";
    }

    if (name === "OverconstrainedError") {
      return "The requested camera could not be started. Try a different browser or device.";
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      return "This browser does not support camera access.";
    }

    return `${message} (${name})`;
  };

  const playScanSound = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioContextClass();
      }

      const audioContext = audioContextRef.current;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (err) {
      console.error("Error playing scan sound:", err);
    }
  };

  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoadingMembers(true);
        const data = await fetchMembers();
        setMembers(data);
      } catch (err) {
        console.error("Error fetching members:", err);
        setScannerState("error");
        setScannerMessage("Failed to load members for scanning.");
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, []);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }

      const stopScanner = async () => {
        if (scannerInstanceRef.current) {
          try {
            await scannerInstanceRef.current.stop();
          } catch (err) {
            console.error("Error stopping scanner:", err);
          }
          scannerInstanceRef.current = null;
        }
        if (scannerRef.current) {
          scannerRef.current.innerHTML = "";
        }

        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          try {
            await audioContextRef.current.close();
          } catch (err) {
            console.error("Error closing audio context:", err);
          }
          audioContextRef.current = null;
        }
      };

      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current || scannerInstanceRef.current) return;

    try {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        throw new Error("This page is not running in a secure context.");
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera access.");
      }

      scannerInstanceRef.current = new Html5Qrcode("scanner-camera");
      setScannerState("starting");
      setScannerMessage("Starting camera...");

      await scannerInstanceRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          const scannedId = String(decodedText || "").trim();
          if (!scannedId) return;

          const now = Date.now();
          if (lastScanRef.current.id === scannedId && now - lastScanRef.current.at < 2500) {
            return;
          }
          lastScanRef.current = { id: scannedId, at: now };

          await playScanSound();

          try {
            setScannerState("processing");
            setScannerMessage(`Scanned ${scannedId}. Recording attendance...`);

            const matchedMember = membersRef.current.find(
              (member) =>
                String(member.member_id) === scannedId ||
                String(member.memberId) === scannedId
            );

            if (!matchedMember) {
              throw new Error(`No member found for ID: ${scannedId}`);
            }

            const attendanceRecord = await recordMemberAttendance(matchedMember);

            setScannerState("success");
            setScannerMessage(
              `${attendanceRecord.member_name} attendance recorded at ${attendanceRecord.attendance_date} ${attendanceRecord.attendance_time}`
            );

            const highlightData = {
              name: matchedMember.full_name || attendanceRecord.member_name,
              memberId: matchedMember.member_id || matchedMember.memberId,
              photoUrl: matchedMember.photo_url || "",
            };
            setScanHighlightMember(highlightData);
            setScanHighlightVisible(true);

            if (fadeTimerRef.current) {
              clearTimeout(fadeTimerRef.current);
            }
            if (clearTimerRef.current) {
              clearTimeout(clearTimerRef.current);
            }

            fadeTimerRef.current = setTimeout(() => {
              setScanHighlightVisible(false);
            }, 9000);

            clearTimerRef.current = setTimeout(() => {
              setScanHighlightMember(null);
            }, 10000);
          } catch (err) {
            console.error("Attendance scan error:", err);
            setScannerState("error");
            setScannerMessage(err.message || "Failed to record attendance.");
          } finally {
            setTimeout(() => {
              setScannerState("ready");
              setScannerMessage("Camera ready. Point it at a member QR code.");
            }, 400);
          }
        }
      );

      setScannerState("ready");
      setScannerMessage("Camera ready. Point it at a member QR code.");
    } catch (err) {
      console.error("Scanner start error:", err);
      scannerInstanceRef.current = null;
      setScannerState("error");
      setScannerMessage(formatCameraError(err));
    }
  };

  const stopScanner = async () => {
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerInstanceRef.current = null;
    }
    if (scannerRef.current) {
      scannerRef.current.innerHTML = "";
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        await audioContextRef.current.close();
      } catch (err) {
        console.error("Error closing audio context:", err);
      }
      audioContextRef.current = null;
    }
    setScannerState("idle");
    setScannerMessage("Click Start Camera to begin scanning a member QR code.");
  };

  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <div className={`${styles.content} tab-slide-animation`}>
        <h1 className={styles.title}>Scanner</h1>

        <div className={styles.scannerCard}>
          <div className={styles.scannerHeader}>
            <h2 className={styles.scannerTitle}>Attendance Scanner</h2>
            <p className={styles.scannerSubtitle}>
              Scan a member QR code to record attendance date and time in Supabase.
            </p>
          </div>

          {scanHighlightMember && (
            <div
              className={`${styles.scanHighlightCard} ${
                scanHighlightVisible ? "" : styles.scanHighlightCardFade
              }`}
            >
              {scanHighlightMember.photoUrl ? (
                <img
                  src={scanHighlightMember.photoUrl}
                  alt={scanHighlightMember.name}
                  className={styles.scanHighlightPhoto}
                />
              ) : (
                <div className={styles.scanHighlightPlaceholder}>👤</div>
              )}
              <div className={styles.scanHighlightInfo}>
                <p className={styles.scanHighlightTitle}>Attendance Recorded</p>
                <p className={styles.scanHighlightName}>{scanHighlightMember.name}</p>
                <p className={styles.scanHighlightId}>{scanHighlightMember.memberId}</p>
              </div>
            </div>
          )}

          <div className={styles.scannerViewport}>
            <div id="scanner-camera" ref={scannerRef} className={styles.scannerFrame} />
          </div>

          <div className={styles.scannerActions}>
            <button className={styles.scannerStartBtn} onClick={startScanner} disabled={loadingMembers}>
              Start Camera
            </button>
            <button className={styles.scannerStopBtn} onClick={stopScanner}>
              Stop Camera
            </button>
          </div>

          <div className={`${styles.scannerStatus} ${styles[`scannerStatus_${scannerState}`] || ""}`}>
            {loadingMembers ? "Loading members..." : scannerMessage}
          </div>

          <div className={styles.scannerHint}>
            QR must contain the exact member ID, for example: <strong>MEM-2026-5149</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
