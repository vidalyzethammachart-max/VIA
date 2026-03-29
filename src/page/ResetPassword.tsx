import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo_no_bg.png";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage("เปลี่ยนรหัสผ่านสำเร็จ!");
        setTimeout(async () => {
          await supabase.auth.signOut();
          navigate("/");
        }, 3000);
      }
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // กำหนดว่าผู้ใช้อยู่ใน session สำหรับกู้คืนรหัสผ่านหรือไม่
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // บางครั้ง session ยังไม่ได้แนบมาทันที 
        // สามารถแสดงข้อความเตือนให้ ผู้ใช้ตรวจสอบลิงก์
      }
    };
    
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery event triggered.");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#f7f9fb]">
      <div className="relative z-10 flex items-center justify-center w-full px-4 py-12 max-w-md rounded-2xl bg-[#ffffff] border-4 border-[#eaeef2] shadow-lg shadow-gray-200/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md backdrop-blur-lg p-8 rounded-2xl shadow-4xl"
        >
          <div className="flex justify-center p-2 mb-4">
            <img src={Logo} alt="Logo" className="w-100 h-auto" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-center text-black mb-2">
              ตั้งรหัสผ่านใหม่
            </h2>
            <p className="text-sm text-center text-gray-500 mb-6">
              ระบุรหัสผ่านใหม่ที่คุณต้องการใช้
            </p>
          </div>

          {message && (
            <div className="mb-4 text-sm text-green-700 bg-green-100 p-3 rounded-lg border border-green-200 text-center">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-100 p-3 rounded-lg border border-red-200 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="block text-gray-600 mb-1 font-medium">
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-[#ffffff] text-black border border-gray-500 rounded-lg focus:ring-1 focus:ring-[#04418b] focus:outline-none"
                placeholder="ระบุรหัสผ่านใหม่"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-600 mb-1 font-medium">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-[#ffffff] text-black border border-gray-500 rounded-lg focus:ring-1 focus:ring-[#04418b] focus:outline-none"
                placeholder="ระบุรหัสผ่านใหม่อีกครั้งยืนยัน"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full bg-[#04418b] hover:bg-[#04416b] text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? "กำลังปรับปรุง..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
