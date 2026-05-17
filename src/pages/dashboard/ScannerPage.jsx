import { useEffect, useRef, useState } from "react";
import styles from "./ScannerPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import { fetchMembers } from "../../services/memberService";
import { recordMemberAttendance } from "../../services/attendanceService";

export default function ScannerPage({ onNavigate, activePage = "scanner" }) {
  const membersRef = useRef([]);
  const scanInputRef = useRef(null);
  const lastScanRef = useRef({ id: "", at: 0 });
  const fadeTimerRef = useRef(null);
  const clearTimerRef = useRef(null);
  const duplicateTimerRef = useRef(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [scannerState, setScannerState] = useState("idle");
  const [scannerMessage, setScannerMessage] = useState(
    "Focus the scan field and scan a member QR code."
  );
  const [scanValue, setScanValue] = useState("");
  const [scanHighlightMember, setScanHighlightMember] = useState(null);
  const [scanHighlightVisible, setScanHighlightVisible] = useState(false);

  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [scannerState]);

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
      if (duplicateTimerRef.current) {
        clearTimeout(duplicateTimerRef.current);
      }
    };
  }, []);

  const processScannedId = async (scannedId) => {
    const normalizedId = String(scannedId || "").trim();
    if (!normalizedId) return;

    const now = Date.now();
    if (lastScanRef.current.id === normalizedId && now - lastScanRef.current.at < 2500) {
      return;
    }

    lastScanRef.current = { id: normalizedId, at: now };

    let duplicateScan = false;

    try {
      setScannerState("processing");
      setScannerMessage(`Scanned ${normalizedId}. Recording attendance...`);

      const matchedMember = membersRef.current.find(
        (member) =>
          String(member.member_id) === normalizedId ||
          String(member.memberId) === normalizedId
      );

      if (!matchedMember) {
        throw new Error(`No member found for ID: ${normalizedId}`);
      }

      const attendanceRecord = await recordMemberAttendance(matchedMember);

      setScannerState("success");
      setScannerMessage(
        `${attendanceRecord.member_name} attendance recorded at ${attendanceRecord.attendance_date} ${attendanceRecord.attendance_time}`
      );

      setScanHighlightMember({
        name: matchedMember.full_name || attendanceRecord.member_name,
        memberId: matchedMember.member_id || matchedMember.memberId,
        photoUrl: matchedMember.photo_url || "",
      });
      setScanHighlightVisible(true);

      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current);

      fadeTimerRef.current = setTimeout(() => {
        setScanHighlightVisible(false);
      }, 9000);

      clearTimerRef.current = setTimeout(() => {
        setScanHighlightMember(null);
      }, 10000);
    } catch (err) {
      console.error("Attendance scan error:", err);
      duplicateScan = err?.code === "ATTENDANCE_ALREADY_RECORDED";
      setScannerState(duplicateScan ? "duplicate" : "error");
      setScannerMessage(err.message || "Failed to record attendance.");

      if (duplicateScan) {
        if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current);

        duplicateTimerRef.current = setTimeout(() => {
          setScannerState("ready");
          setScannerMessage("Scan the next member QR code.");
        }, 5000);
      }
    } finally {
      if (!duplicateScan) {
        setTimeout(() => {
          setScannerState("ready");
          setScannerMessage("Scan the next member QR code.");
        }, 400);
      }
    }
  };

  const handleScanChange = (e) => {
    const value = e.target.value;
    setScanValue(value);

    if (value.trim()) {
      setScannerState("ready");
      setScannerMessage("Scanner ready. Press Enter when the QR code finishes.");
    }
  };

  const handleScanKeyDown = async (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    const scannedId = scanValue.trim();
    setScanValue("");
    await processScannedId(scannedId);
  };

  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <div className={`${styles.content} tab-slide-animation`}>
        <h1 className={styles.title}>Scanner</h1>

        <div
          className={`${styles.scannerCard} ${
            scannerState === "duplicate" ? styles.scannerCardDuplicate : ""
          }`}
        >
          <div className={styles.scannerHeader}>
            <h2 className={styles.scannerTitle}>Attendance Scanner</h2>
            <p className={styles.scannerSubtitle}>
              Focus the field below, scan a member QR code, then press Enter to record attendance.
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

          <div className={styles.scannerInputWrap}>
            <label className={styles.scannerInputLabel} htmlFor="scanner-input">
              Scanned QR Text
            </label>
            <input
              id="scanner-input"
              ref={scanInputRef}
              className={styles.scannerInput}
              value={scanValue}
              onChange={handleScanChange}
              onKeyDown={handleScanKeyDown}
              placeholder="Scan member ID here"
              autoComplete="off"
              spellCheck={false}
            />
            <div className={styles.scannerInputHint}>
              The scanner should type the member ID here automatically.
            </div>
          </div>

          <div className={`${styles.scannerStatus} ${styles[`scannerStatus_${scannerState}`] || ""}`}>
            {loadingMembers ? "Loading members..." : scannerMessage}
          </div>

          <div className={styles.scannerHint}>
              Members only.
          </div>
        </div>
      </div>
    </div>
  );
}
