import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

import Logo from "../assets/logo_no_bg.png";

type Props = {};

export default function Login({}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Username or password is incorrect.");
    } else {
      console.log("Login success:", data.user);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/register");
  }

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
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
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
            <button
              type="submit"
              className="w-full bg-[#04418b] hover:bg-[#04416b] text-white py-2 rounded-lg font-semibold transition"
            >
              Login
            </button>
            <button
              type="submit"
              className="w-full bg-[#1a5fb4] hover:bg-[#04416b] text-white py-2 rounded-lg font-semibold transition"
              onClick={handleRegister}
            >
              Register
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
