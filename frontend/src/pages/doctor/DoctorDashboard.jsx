import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

const DOCTOR_SERVICE_URL =
	import.meta.env.VITE_DOCTOR_SERVICE_URL || "http://localhost:5029";

const getToken = () =>
	localStorage.getItem("token") || localStorage.getItem("accessToken") || "";

const decodeTokenPayload = (token) => {
	const payload = token?.split(".")?.[1];
	if (!payload) {
		return null;
	}

	try {
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const json = atob(base64);
		return JSON.parse(json);
	} catch {
		return null;
	}
};

const resolveDoctorId = () => {
	const storedDoctorId = localStorage.getItem("doctorId");
	if (storedDoctorId) {
		return storedDoctorId;
	}

	const token = getToken();
	const payload = decodeTokenPayload(token);
	return payload?.doctorId || payload?.id || payload?.userId || null;
};

const getErrorMessage = (error) =>
	error?.response?.data?.message || error?.message || "Something went wrong.";

const DoctorDashboard = () => {
	const navigate = useNavigate();
	const [pendingCount, setPendingCount] = useState(0);
	const [scheduleCount, setScheduleCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const loadSummary = useCallback(async () => {
		setLoading(true);
		setError("");

		try {
			const doctorId = resolveDoctorId();
			const token = getToken();
			if (!doctorId || !token) {
				throw new Error("Doctor ID not found.");
			}

			const headers = { Authorization: `Bearer ${token}` };
			const [pendingResponse, scheduleResponse] = await Promise.all([
				axios.get(`${DOCTOR_SERVICE_URL}/api/appointments/doctor/${doctorId}`, {
					headers,
					params: { status: "BOOKED" }
				}),
				axios.get(`${DOCTOR_SERVICE_URL}/api/appointments/doctor/${doctorId}`, {
					headers,
					params: { status: "CONFIRMED" }
				})
			]);

			const pendingPayload =
				pendingResponse.data?.data?.appointments ||
				pendingResponse.data?.appointments ||
				pendingResponse.data?.data?.items ||
				pendingResponse.data?.items ||
				pendingResponse.data?.data ||
				pendingResponse.data ||
				[];
			const schedulePayload =
				scheduleResponse.data?.data?.appointments ||
				scheduleResponse.data?.appointments ||
				scheduleResponse.data?.data?.items ||
				scheduleResponse.data?.items ||
				scheduleResponse.data?.data ||
				scheduleResponse.data ||
				[];

			const pendingItems = Array.isArray(pendingPayload)
				? pendingPayload
				: pendingPayload?.items || [];
			const scheduleItems = Array.isArray(schedulePayload)
				? schedulePayload
				: schedulePayload?.items || [];

			setPendingCount(Array.isArray(pendingItems) ? pendingItems.length : 0);
			setScheduleCount(Array.isArray(scheduleItems) ? scheduleItems.length : 0);
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadSummary();
	}, [loadSummary]);

	if (loading) {
		return (
			<div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-10">
				<LoadingSpinner label="Loading overview..." />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div
				className="rounded-2xl border p-6"
				style={{ borderColor: "#30363d", background: "#161b22" }}
			>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h2 className="text-xl font-semibold">Overview</h2>
						<p className="text-sm" style={{ color: "#8b949e" }}>
							Quick snapshot of pending requests and upcoming schedule
						</p>
					</div>
					<button
						type="button"
						aria-label="Refresh overview"
						onClick={loadSummary}
						className="rounded-xl border px-4 py-2 text-sm font-semibold"
						style={{ borderColor: "#00b4c8", color: "#00b4c8" }}
					>
						Refresh
					</button>
				</div>
			</div>

			{error ? (
				<div
					className="rounded-xl border px-4 py-3 text-sm"
					style={{ borderColor: "#f85149", color: "#f85149", background: "#3d1a1a" }}
				>
					{error}
				</div>
			) : null}

			<div className="grid gap-4 lg:grid-cols-2">
				<div
					className="rounded-2xl border p-6"
					style={{ borderColor: "#30363d", background: "#161b22" }}
				>
					<h3 className="text-lg font-semibold">Pending Requests</h3>
					<p className="mt-2 text-3xl font-semibold" style={{ color: "#d29922" }}>
						{pendingCount}
					</p>
					<button
						type="button"
						aria-label="View pending requests"
						onClick={() => navigate("/doctor/pending")}
						className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold"
						style={{ borderColor: "#d29922", color: "#d29922" }}
					>
						View Pending
					</button>
				</div>

				<div
					className="rounded-2xl border p-6"
					style={{ borderColor: "#30363d", background: "#161b22" }}
				>
					<h3 className="text-lg font-semibold">Upcoming Schedule</h3>
					<p className="mt-2 text-3xl font-semibold" style={{ color: "#3fb950" }}>
						{scheduleCount}
					</p>
					<button
						type="button"
						aria-label="View schedule"
						onClick={() => navigate("/doctor/schedule")}
						className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold"
						style={{ borderColor: "#3fb950", color: "#3fb950" }}
					>
						View Schedule
					</button>
				</div>
			</div>
		</div>
	);
};

export default DoctorDashboard;
