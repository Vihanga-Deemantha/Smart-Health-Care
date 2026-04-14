import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["PENDING", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true
    },
    provider: { type: String, default: "INTERNAL" },
    providerPaymentId: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

paymentSchema.index({ appointmentId: 1, status: 1 }, { name: "idx_payment_appointment_status" });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
