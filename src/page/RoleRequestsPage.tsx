import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { normalizeRole, roleAtLeast, type AppRole } from "../lib/roles";
import {
  roleRequestService,
  type RoleRequestRow,
  type RoleRequestStatus,
} from "../services/roleRequestService";
import MainNavbar from "../components/MainNavbar";
import BackButton from "../components/BackButton";
import ConfirmModal from "../components/ConfirmModal";

type UserInfoMap = Record<string, { email: string | null; role: AppRole }>;

export default function RoleRequestsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentRole, setCurrentRole] = useState<AppRole>("user");
  const [requests, setRequests] = useState<RoleRequestRow[]>([]);
  const [userInfoMap, setUserInfoMap] = useState<UserInfoMap>({});
  const [error, setError] = useState<string | null>(null);
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);

  useEffect(() => {
    void loadPage();
  }, []);

  const pendingRequest = useMemo(
    () => requests.find((request) => request.status === "pending"),
    [requests],
  );

  const loadPage = async () => {
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

      const { data: me } = await supabase
        .from("user_information")
        .select("role")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      const role = normalizeRole(me?.role);
      const admin = roleAtLeast(role, "admin");
      setIsAdmin(admin);
      setCurrentRole(role);

      const fetchedRequests = admin
        ? await roleRequestService.adminGetAllRequests()
        : await roleRequestService.getMyRequests();
      setRequests(fetchedRequests);

      if (admin) {
        const { data: users } = await supabase
          .from("user_information")
          .select("auth_user_id,email,role");

        const map: UserInfoMap = {};
        for (const row of users ?? []) {
          map[row.auth_user_id] = {
            email: row.email,
            role: normalizeRole(row.role),
          };
        }
        setUserInfoMap(map);
      }
    } catch (loadError: unknown) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load role requests.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEditorRole = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await roleRequestService.requestRole("editor");
      await loadPage();
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : "Failed to request role.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (requestId: string, status: RoleRequestStatus) => {
    setSubmitting(true);
    setError(null);
    try {
      if (status === "approved") {
        await roleRequestService.approveRequest(requestId);
      } else {
        await roleRequestService.rejectRequest(requestId);
      }
      await loadPage();
    } catch (reviewError: unknown) {
      const message = reviewError instanceof Error ? reviewError.message : "Failed to review request.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelRequestId) return;

    setSubmitting(true);
    setError(null);
    try {
      await roleRequestService.cancelRequest(cancelRequestId);
      setCancelRequestId(null);
      await loadPage();
    } catch (cancelError: unknown) {
      const message = cancelError instanceof Error ? cancelError.message : "Failed to cancel request.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ConfirmModal
        isOpen={Boolean(cancelRequestId)}
        title="Cancel role request?"
        message="This pending role request will be cancelled and removed from admin review. You can submit a new request later."
        onCancel={() => {
          if (!submitting) setCancelRequestId(null);
        }}
        onConfirm={() => void handleCancelRequest()}
        confirmLabel="Yes, cancel request"
        cancelLabel="Keep request"
        confirmDisabled={submitting}
      />

      <MainNavbar />
      <BackButton onBack={() => navigate(-1)} />
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Role Requests</h1>
          <div className="flex gap-2">
            {isAdmin && (
              <Link
                to="/admin-dashboard"
                className="rounded-lg bg-[#04418b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#03326a]"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>

        {!isAdmin && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-800">Request Role Upgrade</h2>
            <p className="mt-1 text-sm text-slate-500">
              Current role: <span className="font-semibold text-slate-700">{currentRole}</span>
            </p>
            <button
              onClick={handleRequestEditorRole}
              disabled={submitting || roleAtLeast(currentRole, "editor") || Boolean(pendingRequest)}
              className="mt-4 rounded-lg bg-[#04418b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#03326a] disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {pendingRequest
                ? "Request Pending"
                : roleAtLeast(currentRole, "editor")
                  ? "Already Editor/Admin"
                  : "Request Editor Role"}
            </button>
          </section>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              {isAdmin ? "All Role Requests" : "My Role Requests"}
            </h2>
          </div>
          {loading ? (
            <div className="px-4 py-8 text-sm text-slate-500">Loading requests...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-slate-600">
                  <tr>
                    {isAdmin && <th className="px-4 py-3">User</th>}
                    <th className="px-4 py-3">Requested Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created At</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-t border-slate-100">
                      {isAdmin && (
                        <td className="px-4 py-3 text-slate-800">
                          {userInfoMap[request.user_id]?.email ?? request.user_id}
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-800">{request.requested_role}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(request.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          request.status === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => void handleReview(request.id, "approved")}
                                disabled={submitting}
                                className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => void handleReview(request.id, "rejected")}
                                disabled={submitting}
                                className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Reviewed</span>
                          )
                        ) : request.status === "pending" ? (
                          <button
                            onClick={() => setCancelRequestId(request.id)}
                            disabled={submitting}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={isAdmin ? 5 : 4}>
                        No role requests found.
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

function StatusBadge({ status }: { status: RoleRequestStatus }) {
  const classes =
    status === "approved"
      ? "bg-green-100 text-green-700"
      : status === "rejected"
        ? "bg-red-100 text-red-700"
        : status === "cancelled"
          ? "bg-slate-100 text-slate-700"
          : "bg-yellow-100 text-yellow-700";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classes}`}>{status}</span>;
}
