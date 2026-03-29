import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// กำหนดเวลา session timeout (24 ชั่วโมง = 86400 วินาที)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // มิลลิวินาที
const WARNING_TIME = 5 * 60 * 1000; // แจ้งเตือนก่อน 5 นาที

export default function SessionMonitor() {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    let warningId: number;
    let checkInterval: number;

    const startSessionTimer = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // ตั้งเวลาแจ้งเตือนก่อนหมดอายุ 5 นาที
      const warningTime = SESSION_TIMEOUT - WARNING_TIME;
      if (warningTime > 0) {
        warningId = setTimeout(() => {
          setShowWarning(true);
        }, warningTime);
      }

      // ตั้งเวลา logout อัตโนมัติหลังจาก 24 ชั่วโมง
      timeoutId = setTimeout(() => {
        handleLogout();
      }, SESSION_TIMEOUT);
    };

    const handleLogout = async () => {
      await supabase.auth.signOut();
      setShowWarning(false);
      navigate("/", { replace: true });
    };

    // เริ่มต้นตรวจสอบ session
    startSessionTimer();

    // ตรวจสอบ session ทุก 1 นาที
    checkInterval = setInterval(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          navigate("/", { replace: true });
        }
      });
    }, 60 * 1000);

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (warningId) clearTimeout(warningId);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [navigate]);

  // แสดงการแจ้งเตือนก่อน logout
  if (showWarning) {
    return (
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          background: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: 8,
          padding: "16px 20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          maxWidth: 360,
        }}
      >
        <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div>
            <h4 style={{ margin: 0, marginBottom: 8, color: "#856404" }}>
              Session กำลังจะหมดอายุ
            </h4>
            <p style={{ margin: 0, fontSize: 14, color: "#856404" }}>
              ระบบจะทำการ logout อัตโนมัติในอีก 5 นาที
              กรุณาบันทึกงานของคุณ
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
