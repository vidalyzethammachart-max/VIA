import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";

import Logo from "../assets/logo_no_bg.png";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    // สมัครสมาชิก
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // options: {
      //   emailRedirectTo: `${window.location.origin}/`, // ถ้าคุณใช้ confirm email + redirect
      // },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // กรณีเปิด Email confirmation: user อาจยังไม่ login จนกว่าจะกดยืนยันในอีเมล
    if (!data.session) {
      setSuccessMsg("สมัครสำเร็จ! กรุณาไปยืนยันอีเมลก่อนเข้าสู่ระบบ");
      return;
    }

    // กรณีไม่ได้บังคับ confirm email: จะได้ session เลย
    navigate("/form-submit");
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#f7f9fb]">
      <div className="relative z-10 flex items-center justify-center w-full px-4 py-12 max-w-md rounded-2xl bg-[#ffffff] border-4 border-[#eaeef2] shadow-lg shadow-gray-200/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md backdrop-blur-lg p-8 rounded-2xl shadow-4xl"
        >
          <div className="flex justify-center p-2">
            <img src={Logo} alt="Logo" className="w-100 h-auto" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-center text-black mb-6">
              VIDEO INTELLIGENCE &amp; ANALYTICS
            </h2>
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">
                  Email
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-[#ffffff] text-black border border-gray-500 rounded-lg focus:ring-1 focus:ring-[#04418b] focus:outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[#ffffff] text-black border border-gray-500 rounded-lg focus:ring-1 focus:ring-[#04418b] focus:outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="block text-gray-600 mb-1 font-medium">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  className="w-full px-4 py-2 bg-[#ffffff] text-black border border-gray-500 rounded-lg focus:ring-1 focus:ring-[#04418b] focus:outline-none"
                  placeholder="Enter your confirm password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {errorMsg && (
                <p style={{ color: "crimson", marginBottom: 10 }}>{errorMsg}</p>
              )}
              {successMsg && (
                <p style={{ color: "green", marginBottom: 10 }}>{successMsg}</p>
              )}

              <button
                type="submit"
                className="w-full bg-[#1a5fb4] hover:bg-[#04416b] text-white py-2 rounded-lg font-semibold transition"
                onClick={handleRegister}
              >
                Register
              </button>
            </form>
            <p className="text-gray-600 mt-4 text-center text-sm">
              มีบัญชีแล้ว? <Link to="/">ไปหน้า Login</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
