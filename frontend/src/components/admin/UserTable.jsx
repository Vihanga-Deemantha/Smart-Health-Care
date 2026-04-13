import { useState } from "react";
import { formatDate } from "../../utils/formatDate.js";
import StatusBadge from "../common/StatusBadge.jsx";

const UserTable = ({ users, updatingUserId, onToggleStatus }) => {
  const [statusDraft, setStatusDraft] = useState(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const openSuspendDialog = (user) => {
    setStatusDraft(user);
    setReason("");
    setReasonError("");
  };

  const closeSuspendDialog = () => {
    setStatusDraft(null);
    setReason("");
    setReasonError("");
  };

  const confirmSuspension = () => {
    if (!reason.trim()) {
      setReasonError("Suspension reason is required.");
      return;
    }

    onToggleStatus(statusDraft._id, "SUSPENDED", reason.trim());
    closeSuspendDialog();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:hidden">
        {users.map((user) => {
          const nextStatus = user.accountStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

          return (
            <article
              key={user._id}
              className="rounded-[24px] border border-[#E0E7EF] bg-white p-5 shadow-[0_10px_30px_rgba(47,128,237,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#1D2D50]">{user.fullName}</h3>
                  <p className="mt-1 text-sm text-[#4A6078]">{user.email}</p>
                  <p className="text-xs text-[#8BA0B8]">{user.phone}</p>
                </div>
                <StatusBadge value={user.role} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#4A6078]">
                <div>
                  <dt className="text-[#8BA0B8]">Email status</dt>
                  <dd className="mt-1">
                    <StatusBadge value={user.isEmailVerified ? "ACTIVE" : "PENDING"} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[#8BA0B8]">Account</dt>
                  <dd className="mt-1">
                    <StatusBadge value={user.accountStatus} />
                  </dd>
                  {user.accountStatusReason ? (
                    <p className="mt-1 text-xs text-[#8BA0B8]">{user.accountStatusReason}</p>
                  ) : null}
                </div>
                <div>
                  <dt className="text-[#8BA0B8]">Doctor review</dt>
                  <dd className="mt-1">
                    <StatusBadge value={user.doctorVerificationStatus} />
                  </dd>
                  {user.doctorRejectionReason ? (
                    <p className="mt-1 text-xs text-[#8BA0B8]">{user.doctorRejectionReason}</p>
                  ) : null}
                </div>
                <div>
                  <dt className="text-[#8BA0B8]">Created</dt>
                  <dd className="mt-1 text-[#1D2D50]">{formatDate(user.createdAt)}</dd>
                </div>
              </dl>

              <button
                type="button"
                disabled={updatingUserId === user._id}
                onClick={() =>
                  nextStatus === "SUSPENDED"
                    ? openSuspendDialog(user)
                    : onToggleStatus(user._id, nextStatus)
                }
                className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50 ${
                  nextStatus === "SUSPENDED"
                    ? "border border-[#F4C2BD] bg-[#FDEEEE] text-[#C0392B]"
                    : "border border-[#CBEED8] bg-[#ECF8F1] text-[#1F7A46]"
                }`}
              >
                {nextStatus === "SUSPENDED" ? "Suspend user" : "Activate user"}
              </button>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-[28px] border border-[#E0E7EF] bg-white shadow-[0_10px_30px_rgba(47,128,237,0.08)] md:block">
        <div className="flex items-center justify-between border-b border-[#E0E7EF] bg-[#F9FBFF] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
              User directory
            </p>
            <p className="mt-1 text-sm text-[#5C708A]">
              Review access state, verification state, and status history without leaving the table.
            </p>
          </div>
          <div className="rounded-2xl border border-[#E0E7EF] bg-white px-4 py-3 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
              Visible users
            </p>
            <p className="mt-1 text-xl font-black text-[#0B1F3A]">{users.length}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E0E7EF] text-sm">
            <thead className="bg-[#F9FBFF] text-left text-[#5C708A]">
              <tr>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Email</th>
                <th className="px-5 py-4 font-medium">Role</th>
                <th className="px-5 py-4 font-medium">Email verified</th>
                <th className="px-5 py-4 font-medium">Account</th>
                <th className="px-5 py-4 font-medium">Doctor review</th>
                <th className="px-5 py-4 font-medium">Created</th>
                <th className="px-5 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3F8]">
              {users.map((user) => {
                const nextStatus = user.accountStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

                return (
                  <tr key={user._id} className="text-[#4A6078] transition hover:bg-[#F9FBFF]">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#1D2D50]">{user.fullName}</div>
                      <div className="text-xs text-[#8BA0B8]">{user.phone}</div>
                    </td>
                    <td className="px-5 py-4">{user.email}</td>
                    <td className="px-5 py-4">
                      <StatusBadge value={user.role} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge value={user.isEmailVerified ? "ACTIVE" : "PENDING"} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge value={user.accountStatus} />
                      {user.accountStatusReason ? (
                        <div className="mt-1 max-w-48 text-xs text-[#8BA0B8]">
                          {user.accountStatusReason}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge value={user.doctorVerificationStatus} />
                      {user.doctorRejectionReason ? (
                        <div className="mt-1 max-w-48 text-xs text-[#8BA0B8]">
                          {user.doctorRejectionReason}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={updatingUserId === user._id}
                        onClick={() =>
                          nextStatus === "SUSPENDED"
                            ? openSuspendDialog(user)
                            : onToggleStatus(user._id, nextStatus)
                        }
                        className={`rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50 ${
                          nextStatus === "SUSPENDED"
                            ? "border border-[#F4C2BD] bg-[#FDEEEE] text-[#C0392B]"
                            : "border border-[#CBEED8] bg-[#ECF8F1] text-[#1F7A46]"
                        }`}
                      >
                        {nextStatus === "SUSPENDED" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {statusDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-[#E0E7EF] bg-white p-6 shadow-[0_20px_50px_rgba(11,31,58,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#EB5757]">
              Suspend Account
            </p>
            <h3 className="mt-3 text-xl font-semibold text-[#1D2D50]">
              Suspend {statusDraft.fullName}?
            </h3>
            <p className="mt-2 text-sm text-[#5C708A]">
              Add a clear administrative reason. This will be stored with the account status update
              and included in the notification email.
            </p>

            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setReasonError("");
              }}
              rows={5}
              placeholder="Explain why this account is being suspended"
              className="mt-5 w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none placeholder:text-[#8BA0B8]"
            />
            {reasonError ? <p className="mt-2 text-sm text-[#EB5757]">{reasonError}</p> : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={updatingUserId === statusDraft._id}
                onClick={confirmSuspension}
                className="rounded-2xl bg-[#EB5757] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Confirm suspension
              </button>
              <button
                type="button"
                onClick={closeSuspendDialog}
                className="rounded-2xl border border-[#E0E7EF] px-5 py-3 text-sm font-semibold text-[#1D2D50]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UserTable;
