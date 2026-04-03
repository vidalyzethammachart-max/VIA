import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { accountingService } from "../services/accountingService";

import Logo from "../assets/logo_no_bg.png";

function RegisterWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f9fb]">
      <div className="relative z-10 flex w-full max-w-md items-center justify-center rounded-2xl border-4 border-[#eaeef2] bg-[#ffffff] px-4 py-12 shadow-lg shadow-gray-200/50">
        <div className="relative z-10 w-full max-w-md rounded-2xl p-8 backdrop-blur-lg">
          <div className="flex justify-center p-2">
            <img src={Logo} alt="Logo" className="h-auto w-100" />
          </div>
          <h2 className="mb-6 text-center text-2xl font-bold text-black">
            VIDEO INTELLIGENCE &amp; ANALYTICS
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¸•à¹‰à¸­à¸‡à¸¡à¸µà¸­à¸¢à¹ˆà¸²à¸‡à¸™à¹‰à¸­à¸¢ 6 à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹„à¸¡à¹ˆà¸•à¸£à¸‡à¸à¸±à¸™");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.user) {
      setNeedsVerification(!data.session);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { error: insertError } = await supabase
        .from("user_information")
        .upsert(
          {
            auth_user_id: data.user.id,
            user_id: userId,
            email,
          },
          { onConflict: "auth_user_id" },
        );

      if (insertError) {
        console.error("âŒ Data Insertion Error:", insertError);
        setErrorMsg(
          `à¸ªà¸¡à¸±à¸„à¸£à¸ªà¸¡à¸²à¸Šà¸´à¸à¸ªà¸³à¹€à¸£à¹‡à¸ˆà¹à¸•à¹ˆà¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹‚à¸›à¸£à¹„à¸Ÿà¸¥à¹Œà¹„à¸”à¹‰: ${insertError.message}`,
        );
        return;
      }

      void accountingService
        .logActivity({
          user_id: data.user.id,
          action: "auth.registered",
          resource: "auth",
          metadata: {
            email_verified_immediately: Boolean(data.session),
          },
        })
        .catch((logError) => {
          console.error("Activity log failed:", logError);
        });
    }

    await supabase.auth.signOut();
    setRegistered(true);
  };

  if (registered) {
    return (
      <RegisterWrapper>
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#1a5fb4]/30 bg-[#1a5fb4]/10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1a5fb4"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <div className="space-y-1">
            <p className="text-xl font-bold text-slate-900">
               สมัครสมาชิกเรียบร้อยแล้ว!
            </p>
            <p className="text-sm text-slate-500">
              {needsVerification
                ? "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ"
                : "คุณได้สมัครสมาชิกเรียบร้อยแล้ว สามารถเข้าสู่ระบบได้ทันที"}
            </p>
          </div>

          {needsVerification && (
            <div className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs leading-relaxed text-blue-700">
                 เราได้ส่งอีเมลยืนยันไปที่{" "}
                <span className="font-semibold">{email}</span>{" "}
                 กรุณาตรวจสอบกล่องจดหมายและกดลิงก์ยืนยันก่อนเข้าสู่ระบบ
              </p>
            </div>
          )}

          <Link
            to="/"
            className="mt-2 inline-block w-full rounded-lg bg-[#1a5fb4] py-2.5 text-center font-semibold text-white"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </RegisterWrapper>
    );
  }

  return (
    <RegisterWrapper>
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="mb-1 block font-medium text-gray-600">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-lg border border-gray-500 bg-[#ffffff] px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#04418b]"
            placeholder="Enter your User ID"
            required
          />
        </div>
        <div>
          <label className="mb-1 block font-medium text-gray-600">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-500 bg-[#ffffff] px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#04418b]"
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <label className="mb-1 block font-medium text-gray-600">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-500 bg-[#ffffff] px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#04418b]"
            placeholder="Enter your password"
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="mb-1 block font-medium text-gray-600">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            className="w-full rounded-lg border border-gray-500 bg-[#ffffff] px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#04418b]"
            placeholder="Enter your confirm password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs leading-relaxed text-red-600">{errorMsg}</p>
          </div>
        )}
        <button
          type="submit"
          className="w-full rounded-lg bg-[#1a5fb4] py-2 font-semibold text-white"
        >
          Register
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        มีบัญชีแล้ว? <Link to="/">ไปหน้าเข้าสู่ระบบ</Link>
      </p>
    </RegisterWrapper>
  );
}
