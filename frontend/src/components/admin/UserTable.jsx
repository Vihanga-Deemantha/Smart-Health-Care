import { formatDate } from "../../utils/formatDate.js";
import StatusBadge from "../common/StatusBadge.jsx";

const UserTable = ({ users, updatingUserId, onToggleStatus }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:hidden">
        {users.map((user) => {
          const nextStatus = user.accountStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

          return (
            <article key={user._id} className="rounded-[24px] border border-white/10 bg-slate-900/80 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{user.fullName}</h3>
                  <p className="mt-1 text-sm text-slate-300">{user.email}</p>
                  <p className="text-xs text-slate-500">{user.phone}</p>
                </div>
                <StatusBadge value={user.role} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div>
                  <dt className="text-slate-500">Email status</dt>
                  <dd className="mt-1">
                    <StatusBadge value={user.isEmailVerified ? "ACTIVE" : "PENDING"} />
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Account</dt>
                  <dd className="mt-1">
                    <StatusBadge value={user.accountStatus} />
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Doctor review</dt>
                  <dd className="mt-1">
                    <StatusBadge value={user.doctorVerificationStatus} />
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Created</dt>
                  <dd className="mt-1 text-white">{formatDate(user.createdAt)}</dd>
                </div>
              </dl>

              <button
                type="button"
                disabled={updatingUserId === user._id}
                onClick={() => onToggleStatus(user._id, nextStatus)}
                className="mt-4 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {nextStatus === "SUSPENDED" ? "Suspend user" : "Activate user"}
              </button>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-slate-400">
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
            <tbody className="divide-y divide-white/5">
              {users.map((user) => {
                const nextStatus = user.accountStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

                return (
                  <tr key={user._id} className="text-slate-200">
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{user.fullName}</div>
                      <div className="text-xs text-slate-500">{user.phone}</div>
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
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge value={user.doctorVerificationStatus} />
                    </td>
                    <td className="px-5 py-4">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={updatingUserId === user._id}
                        onClick={() => onToggleStatus(user._id, nextStatus)}
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
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
    </div>
  );
};

export default UserTable;
