import { Link, useSearchParams } from "react-router-dom";

const BookingConfirmation = () => {
  const [params] = useSearchParams();
  const appointmentId = params.get("appointmentId");
  const paymentId = params.get("paymentId");

  return (
    <div style={{ padding: 24 }}>
      <h1>Booking Confirmed</h1>
      <p>Your appointment has been booked successfully.</p>
      <p>Appointment ID: {appointmentId}</p>
      <p>Payment ID: {paymentId}</p>
      <div style={{ marginTop: 12 }}>
        <Link to="/doctor-search">Book another appointment</Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;
