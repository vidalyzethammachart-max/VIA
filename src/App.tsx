import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

import Login from "./page/Login";
import FormSubmit from "./page/FormSubmit";

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
    <Routes>
      {/* public */}
      <Route
        path="/"
        element={!session ? <Login /> : <Navigate to="/form-submit" />}
      />

      {/* protected */}
      <Route
        path="/form-submit"
        element={session ? <FormSubmit /> : <Navigate to="/" />}
      />
    </Routes>
  );
}
