import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { normalizeRole, type AppRole } from "../lib/roles";

type AuthRoleState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: AppRole | null;
};

async function fetchRoleForUser(userId: string): Promise<AppRole> {
  const { data, error } = await supabase
    .from("user_information")
    .select("role")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeRole(data?.role);
}

export async function getUserRole(userId: string): Promise<AppRole> {
  return fetchRoleForUser(userId);
}

export function useAuthRole(): AuthRoleState {
  const [state, setState] = useState<AuthRoleState>({
    loading: true,
    session: null,
    user: null,
    role: null,
  });

  useEffect(() => {
    let active = true;

    const syncSession = async (session: Session | null) => {
      const user = session?.user ?? null;

      if (!user) {
        if (!active) return;
        setState({
          loading: false,
          session: null,
          user: null,
          role: null,
        });
        return;
      }

      try {
        const role = await fetchRoleForUser(user.id);

        if (!active) return;
        setState({
          loading: false,
          session,
          user,
          role,
        });
      } catch (error) {
        console.error("Failed to load user role:", error);

        if (!active) return;
        setState({
          loading: false,
          session,
          user,
          role: "user",
        });
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      void syncSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
