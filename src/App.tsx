import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

import Login from "./page/Login";
import FormSubmit from "./page/FormSubmit";
import Register from "./page/Register";
import Profile from "./page/Profile";
import Dashboard from "./page/Dashboard";
import SessionMonitor from "./components/SessionMonitor";
import Footer from "./components/Footer";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex flex-col min-h-screen">
      {/* เพิ่ม SessionMonitor เพื่อตรวจสอบ session timeout */}
      {session && <SessionMonitor />}
      
      <div className="flex-grow">
        <Routes>
          {/* public */}
          <Route
            path="/"
            element={!session ? <Login /> : <Navigate to="/form-submit" />}
          />
          <Route
            path="/register"
            element={<Register />}
          />

          {/* protected */}
          <Route
            path="/form-submit"
            element={session ? <FormSubmit /> : <Navigate to="/" />}
          />
          <Route
            path="/profile"
            element={session ? <Profile /> : <Navigate to="/" />}
          />
          <Route
            path="/dashboard"
            element={session ? <Dashboard /> : <Navigate to="/" />}
          />
        </Routes>
      </div>
      
      <Footer />
    </div>
  );
}
