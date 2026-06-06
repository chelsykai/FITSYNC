import { useEffect, useRef, useState } from "react";
import styles from "./ScannerPage.module.css";
import { fetchMembers } from "../../services/memberService";
import { recordMemberAttendance } from "../../services/attendanceService";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  idle:       { icon: "ti-qr-code",       label: "Idle",       pulse: false },
  ready:      { icon: "ti-qr-code",       label: "Ready",      pulse: true  },
  starting:   { icon: "ti-loader-2",      label: "Starting",   pulse: true  },
  processing: { icon: "ti-loader-2",      label: "Processing", pulse: true  },
  success:    { icon: "ti-circle-check",  label: "Recorded",   pulse: false },
  error:      { icon: "ti-alert-circle",  label: "Error",      pulse: false },
  duplicate:  { icon: "ti-clock-exclamation", label: "Duplicate", pulse: false },
};

export default function ScannerPage() {
  const membersRef       = useRef([]);
  const scanInputRef     = useRef(null);
  const lastScanRef      = useRef({ id: "", at: 0 });
  const fadeTimerRef     = useRef(null);
  const clearTimerRef    = useRef(null);
  const duplicateTimerRef = useRef(null);

  const [members,             setMembers]             = useState([]);
  const [loadingMembers,      setLoadingMembers]      = useState(true);
  const [scannerState,        setScannerState]        = useState("idle");
  const [scannerMessage,      setScannerMessage]      = useState(
    "Focus the scan field and scan a member QR code."
  );
  const [scanValue,           setScanValue]           = useState("");
  const [scanHighlightMember, setScanHighlightMember] = useState(null);
  const [scanHighlightVisible,setScanHighlightVisible]= useState(false);
  const [scanCount,           setScanCount]           = useState(0);
  const [inputFocused,        setInputFocused]        = useState(false);

  // ── Focus helpers ───────────────────────────────────────────────────────────
  const focusInput = () => scanInputRef.current?.focus();

  useEffect(() => { focusInput(); membersRef.current = members; }, [members]);
  useEffect(() => { focusInput(); }, [scannerState]);

  // ── Load members ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  // ── Cleanup timers ──────────────────────────────────────────────────────────
  useEffect(() => () => {
    clearTimeout(fadeTimerRef.current);
    clearTimeout(clearTimerRef.current);
    clearTimeout(duplicateTimerRef.current);
  }, []);

  // ── Core scan logic (unchanged) ─────────────────────────────────────────────
  const processScannedId = async (scannedId) => {
    const normalizedId = String(scannedId || "").trim();
    if (!normalizedId) return;

    const now = Date.now();
    if (lastScanRef.current.id === normalizedId && now - lastScanRef.current.at < 2500) return;
    lastScanRef.current = { id: normalizedId, at: now };

    let duplicateScan = false;

    try {
      setScannerState("processing");
      setScannerMessage(`Scanned ${normalizedId}. Recording attendance...`);

      const matchedMember = membersRef.current.find(
        (m) => String(m.member_id) === normalizedId || String(m.memberId) === normalizedId
      );

      if (!matchedMember) throw new Error(`No member found for ID: ${normalizedId}`);

      const attendanceRecord = await recordMemberAttendance(matchedMember);

      setScannerState("success");
      setScannerMessage(
        `${attendanceRecord.member_name} recorded at ${attendanceRecord.attendance_date} ${attendanceRecord.attendance_time}`
      );
      setScanCount((n) => n + 1);

      setScanHighlightMember({
        name:     matchedMember.full_name || attendanceRecord.member_name,
        memberId: matchedMember.member_id || matchedMember.memberId,
        photoUrl: matchedMember.photo_url || "",
      });
      setScanHighlightVisible(true);

      clearTimeout(fadeTimerRef.current);
      clearTimeout(clearTimerRef.current);
      clearTimeout(duplicateTimerRef.current);

      fadeTimerRef.current  = setTimeout(() => setScanHighlightVisible(false), 9000);
      clearTimerRef.current = setTimeout(() => setScanHighlightMember(null),   10000);
    } catch (err) {
      console.error("Attendance scan error:", err);
      duplicateScan = err?.code === "ATTENDANCE_ALREADY_RECORDED";
      setScannerState(duplicateScan ? "duplicate" : "error");
      setScannerMessage(err.message || "Failed to record attendance.");

      if (duplicateScan) {
        clearTimeout(duplicateTimerRef.current);
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
      setScannerMessage("Scanner ready. Press Enter to record.");
    }
  };

  const handleScanKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const scannedId = scanValue.trim();
    setScanValue("");
    await processScannedId(scannedId);
  };

  // ── Derived UI values ───────────────────────────────────────────────────────
  const cfg        = STATUS_CONFIG[scannerState] || STATUS_CONFIG.idle;
  const isActive   = ["ready", "processing", "starting"].includes(scannerState);
  const isDuplicate = scannerState === "duplicate";
  const isSuccess  = scannerState === "success";
  const isError    = scannerState === "error";

  return (
    <div className={styles.layout} onClick={focusInput}>
      {/* ── Ambient blobs ─────────────────────────────────────────────────── */}
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrow}>Standalone route</span>
          <h1 className={styles.title}>
            <span className={styles.titleIcon} aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="11" y="11" width="26" height="26" rx="8" stroke="currentColor" strokeWidth="3.2"/>
                <path d="M16 18h6M26 18h6M16 24h6M26 24h6M16 30h16" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/>
                <path d="M8 14V8h6M40 14V8h-6M8 34v6h6M40 34v6h-6" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
              </svg>
            </span>
            Scanner
          </h1>
        </div>

        {/* Session counter */}
        <div className={styles.sessionBadge}>
          <span className={styles.sessionCount}>{scanCount}</span>
          <span className={styles.sessionLabel}>scanned today</span>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className={styles.content}>

        {/* ── Scanner card ──────────────────────────────────────────────── */}
        <div className={`${styles.scannerCard} ${isDuplicate ? styles.scannerCardDuplicate : ""} ${isError ? styles.scannerCardError : ""} ${isSuccess ? styles.scannerCardSuccess : ""}`}>

          {/* Card header row */}
          <div className={styles.cardTopRow}>
            <div>
              <h2 className={styles.scannerTitle}>Attendance Scanner</h2>
              <p className={styles.scannerSubtitle}>
                Focus the field, scan a QR code, then press <kbd className={styles.kbd}>Enter</kbd>.
              </p>
            </div>

            {/* Live status pill */}
            <div className={`${styles.statusPill} ${styles[`statusPill_${scannerState}`]}`}>
              <span className={`${styles.statusDot} ${cfg.pulse ? styles.statusDotPulse : ""}`} />
              {cfg.label}
            </div>
          </div>

          {/* ── Member highlight card ──────────────────────────────────── */}
          {scanHighlightMember && (
            <div className={`${styles.highlightCard} ${scanHighlightVisible ? styles.highlightIn : styles.highlightOut}`}>
              <div className={styles.highlightLeft}>
                {scanHighlightMember.photoUrl ? (
                  <img
                    src={scanHighlightMember.photoUrl}
                    alt={scanHighlightMember.name}
                    className={styles.highlightAvatar}
                  />
                ) : (
                  <div className={styles.highlightAvatarFallback}>
                    <span className="ti ti-user" />
                  </div>
                )}
                <div className={styles.highlightSuccessBadge} aria-hidden="true">
                  <span className="ti ti-check" />
                </div>
              </div>
              <div className={styles.highlightInfo}>
                <p className={styles.highlightLabel}>Attendance Recorded</p>
                <p className={styles.highlightName}>{scanHighlightMember.name}</p>
                <p className={styles.highlightId}>
                  <span className="ti ti-id-badge" aria-hidden="true" />
                  {scanHighlightMember.memberId}
                </p>
              </div>
              <div className={styles.highlightCheck} aria-hidden="true">
                <span className="ti ti-circle-check" />
              </div>
            </div>
          )}

          {/* ── Scan input zone ────────────────────────────────────────── */}
          <div
            className={`${styles.inputZone} ${inputFocused ? styles.inputZoneFocused : ""} ${isDuplicate ? styles.inputZoneDuplicate : ""}`}
            onClick={focusInput}
          >
            {/* Big QR icon bg */}
            <div className={styles.inputZoneBgIcon} aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <rect x="11" y="11" width="26" height="26" rx="8" stroke="currentColor" strokeWidth="2.4"/>
                <path d="M16 18h6M26 18h6M16 24h6M26 24h6M16 30h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
                <path d="M8 14V8h6M40 14V8h-6M8 34v6h6M40 34v6h-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <label htmlFor="scanner-input" className={styles.inputLabel}>
              {loadingMembers ? "Loading members…" : "Scan QR code here"}
            </label>

            <input
              id="scanner-input"
              ref={scanInputRef}
              className={styles.scannerInput}
              value={scanValue}
              onChange={handleScanChange}
              onKeyDown={handleScanKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Waiting for scan…"
              autoComplete="off"
              spellCheck={false}
              disabled={loadingMembers}
            />

            <p className={styles.inputHint}>
              The scanner types the member ID automatically — just press <kbd className={styles.kbd}>Enter</kbd>.
            </p>
          </div>

          {/* ── Status message bar ─────────────────────────────────────── */}
          <div className={`${styles.statusBar} ${styles[`statusBar_${scannerState}`]}`}>
            <span className={`ti ${cfg.icon} ${isActive ? styles.spinIcon : ""}`} aria-hidden="true" />
            <span>{loadingMembers ? "Loading member records…" : scannerMessage}</span>
          </div>

          {/* ── Footer hint ────────────────────────────────────────────── */}
          <p className={styles.footerHint}>
            <span className="ti ti-users" aria-hidden="true" /> Members only · Click anywhere to re-focus
          </p>
        </div>

        {/* ── Help panel ────────────────────────────────────────────────── */}
        <div className={styles.helpPanel}>
          <p className={styles.helpTitle}>
            <span className="ti ti-info-circle" aria-hidden="true" />
            How it works
          </p>
          <ul className={styles.helpList}>
            <li>Point the QR scanner at a member's code — it types the ID automatically.</li>
            <li>Press <kbd className={styles.kbd}>Enter</kbd> to record attendance.</li>
            <li>A green card appears confirming the member's name and ID.</li>
            <li>If already scanned today, a duplicate warning will appear for 5 seconds.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}