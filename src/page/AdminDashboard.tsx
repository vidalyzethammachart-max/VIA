import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { normalizeRole, roleAtLeast, type AppRole } from "../lib/roles";
import MainNavbar from "../components/MainNavbar";

type UserRow = {
  auth_user_id: string;
  email: string | null;
  role: AppRole;
};

type DashboardStats = {
  totalUsers: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      const { data: userInfo, error: userInfoError } = await supabase
        .from("user_information")
        .select("role")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      const currentRole = normalizeRole(userInfo?.role);
      if (userInfoError || !roleAtLeast(currentRole, "admin")) {
        navigate("/form-submit", { replace: true });
        return;
      }

      const [
        usersCount,
        requestsCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        usersList,
      ] = await Promise.all([
        supabase
          .from("user_information")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("role_requests")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("role_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("role_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved"),
        supabase
          .from("role_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "rejected"),
        supabase
          .from("user_information")
          .select("auth_user_id,email,role")
          .order("email", { ascending: true }),
      ]);

      if (
        usersCount.error ||
        requestsCount.error ||
        pendingCount.error ||
        approvedCount.error ||
        rejectedCount.error ||
        usersList.error
      ) {
        throw new Error("Failed to load admin dashboard data.");
      }

      setStats({
        totalUsers: usersCount.count ?? 0,
        totalRequests: requestsCount.count ?? 0,
        pendingRequests: pendingCount.count ?? 0,
        approvedRequests: approvedCount.count ?? 0,
        rejectedRequests: rejectedCount.count ?? 0,
      });

      setUsers(
        (usersList.data ?? []).map((row) => ({
          auth_user_id: row.auth_user_id,
          email: row.email,
          role: normalizeRole(row.role),
        })),
      );
    } catch (loadError: unknown) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load dashboard.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNavbar />
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Link
              to="/role-requests"
              className="rounded-lg bg-[#04418b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#03326a]"
            >
              Manage Role Requests
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Back
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Total Requests" value={stats.totalRequests} />
          <StatCard label="Pending" value={stats.pendingRequests} />
          <StatCard label="Approved" value={stats.approvedRequests} />
          <StatCard label="Rejected" value={stats.rejectedRequests} />
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Users</h2>
          </div>
          {loading ? (
            <div className="px-4 py-8 text-sm text-slate-500">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => (
                    <tr key={row.auth_user_id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-800">{row.email ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {row.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={2}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
