import { useEffect, useRef, useState } from "react";
import styles from "./ScannerPage.module.css";
import Sidebar from "../components/sidebar/sidebar";
import { fetchMembers } from "../services/memberService";
import { recordMemberAttendance } from "../services/attendanceService";
import { Html5Qrcode } from "html5-qrcode";

export default function ScannerPage({ onNavigate, activePage = "scanner" }) {
  const scannerRef = useRef(null);
  const membersRef = useRef([]);
  const scannerInstanceRef = useRef(null);
  export { default } from "../pages/dashboard/ScannerPage";