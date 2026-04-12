import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/axios.js";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

const Checkout = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = params.get("appointmentId");
  const doctorId = params.get("doctorId");

  const [amount, setAmount] = useState(50);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    setProcessing(true);
    setError("");
    try {
      const checkoutResponse = await api.post("/payments/checkout", {
        appointmentId,
        doctorId,
        amount,
        currency: "USD"
      });

      const payment = checkoutResponse.data?.data;

      if (!payment?._id) {
        throw new Error("Checkout failed");
      }

      await api.patch(`/payments/${payment._id}/capture`);

      navigate(`/patient/booking-confirmation?appointmentId=${appointmentId}&paymentId=${payment._id}`);
    } catch (error) {
      setError(getApiErrorMessage(error, "Payment failed"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Checkout</h1>
      <p>Appointment: {appointmentId}</p>
      <label>
        Amount (USD)
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          style={{ marginLeft: 8 }}
        />
      </label>
      <div>
        <button onClick={pay} disabled={processing || !appointmentId} style={{ marginTop: 12 }}>
          {processing ? "Processing..." : "Pay Now"}
        </button>
        {error ? (
          <p style={{ marginTop: 12, color: "#f87171" }}>{error}</p>
        ) : null}
      </div>
    </div>
  );
};

export default Checkout;
