import { useState, useEffect } from "react";
import { CheckCircle, Star, AlertCircle } from "lucide-react";
import PatientLayout from "../../components/patient/PatientLayout.jsx";
import api from "../../services/axios.js";
import { fetchPatientAppointments } from "../../api/patientApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const resolveCompletedAt = (appointment) =>
  appointment?.statusTimestamps?.completedAt ||
  appointment?.statusTimestamps?.confirmedAt ||
  appointment?.updatedAt ||
  appointment?.createdAt ||
  null;

const PatientBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  useEffect(() => {
    fetchCompletedAppointments();
  }, []);

  const fetchCompletedAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetchPatientAppointments({ status: "COMPLETED", limit: 100 });
      const items = response.data?.data?.items || [];

      const completedBookings = items.sort(
        (a, b) => new Date(resolveCompletedAt(b) || 0).getTime() - new Date(resolveCompletedAt(a) || 0).getTime()
      );

      const uniqueDoctorIds = [...new Set(completedBookings.map((item) => item?.doctorId).filter(Boolean))];
      const doctorNameEntries = await Promise.all(
        uniqueDoctorIds.map(async (doctorId) => {
          try {
            const doctorResponse = await api.get(`/doctors/${doctorId}`);
            const doctorPayload =
              doctorResponse.data?.data?.doctor || doctorResponse.data?.data || doctorResponse.data;
            const doctorName = doctorPayload?.fullName || doctorPayload?.name || null;
            return [doctorId, doctorName];
          } catch {
            return [doctorId, null];
          }
        })
      );

      const doctorNameMap = new Map(doctorNameEntries);
      const bookingsWithDoctorName = completedBookings.map((item) => {
        const existingName = item?.doctor?.fullName || item?.doctorName || null;
        const resolvedName = existingName || doctorNameMap.get(item?.doctorId) || null;

        if (!resolvedName) {
          return { ...item, doctorName: null };
        }

        const normalizedName =
          String(resolvedName).toLowerCase().startsWith("dr.") ||
          String(resolvedName).toLowerCase().startsWith("dr ")
            ? resolvedName
            : `Dr. ${resolvedName}`;

        return { ...item, doctorName: normalizedName };
      });

      setBookings(bookingsWithDoctorName);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch completed appointments"));
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setReviewRating(5);
    setHoverRating(0);
    setReviewText("");
    setReviewError("");
    setReviewSuccess("");
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedBooking(null);
    setHoverRating(0);
    setReviewError("");
  };

  const submitReview = async () => {
    if (!selectedBooking?._id) {
      setReviewError("Appointment is missing. Please retry.");
      return;
    }

    setReviewSubmitting(true);
    setReviewError("");
    setReviewSuccess("");

    try {
      await api.post("/feedback", {
        appointmentId: selectedBooking._id,
        rating: Number(reviewRating),
        review: reviewText,
        isAnonymous: false
      });

      setReviewSuccess("Review submitted successfully.");
      closeReviewModal();
    } catch (err) {
      setReviewError(getApiErrorMessage(err, "Failed to submit review."));
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <PatientLayout
      eyebrow="Healthcare History"
      title="Completed Bookings"
      description="View your completed appointments and leave reviews."
      accent="cyan"
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-300">Loading completed bookings...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/5 p-4 text-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {reviewSuccess && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">
          {reviewSuccess}
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
          <CheckCircle size={32} className="mx-auto mb-3 text-slate-500" />
          <p className="text-slate-300">No completed bookings yet.</p>
          <p className="text-sm text-slate-400">
            Past appointments with confirmed attendance will appear here.
          </p>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="rounded-lg border border-white/10 bg-white/5 p-6 transition hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{booking.doctorName || "Doctor"}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Completed on {
                      resolveCompletedAt(booking)
                        ? new Date(resolveCompletedAt(booking)).toLocaleDateString()
                        : "N/A"
                    }
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-green-400/10 px-3 py-1 text-green-300">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Duration</p>
                  <p className="mt-1 text-sm text-white">
                    {Math.round((new Date(booking.endTime) - new Date(booking.startTime)) / 60000)} minutes
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Consultation Mode</p>
                  <p className="mt-1 text-sm text-white">{booking.mode}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openReviewModal(booking)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                <Star size={16} />
                Leave Review
              </button>
            </div>
          ))}
        </div>
      )}

      {reviewModalOpen && selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReviewModal();
            }
          }}
        >
          <div className="w-full max-w-xl rounded-xl border border-cyan-200/20 bg-slate-900 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="text-lg font-semibold">Leave a Review</h3>
              <button
                type="button"
                onClick={closeReviewModal}
                className="rounded px-2 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                X
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <p className="text-sm text-slate-300">
                Doctor: <span className="font-medium text-white">{selectedBooking.doctorName || "Doctor"}</span>
              </p>

              {reviewError ? (
                <p className="rounded border border-red-300/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                  {reviewError}
                </p>
              ) : null}

              <div className="block text-sm text-slate-200">
                <p>Rating</p>
                <div
                  className="mt-2 inline-flex items-center gap-2"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const activeValue = hoverRating || reviewRating;
                    const isActive = starValue <= activeValue;

                    return (
                      <button
                        key={starValue}
                        type="button"
                        onMouseEnter={() => setHoverRating(starValue)}
                        onFocus={() => setHoverRating(starValue)}
                        onClick={() => setReviewRating(starValue)}
                        aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                        className="rounded-md p-1 transition hover:bg-white/10"
                      >
                        <Star
                          size={24}
                          className={
                            isActive
                              ? "fill-amber-300 text-amber-300"
                              : "text-slate-500"
                          }
                        />
                      </button>
                    );
                  })}
                  <span className="ml-1 text-xs text-slate-300">
                    {reviewRating}/5
                  </span>
                </div>
              </div>

              <label className="block text-sm text-slate-200">
                Review
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="Share your consultation experience"
                  className="mt-1 w-full rounded border border-white/15 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewSubmitting}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reviewSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PatientLayout>
  );
};

export default PatientBookingsPage;
