import mongoose from "mongoose";

const adminActionSchema = new mongoose.Schema(
  {
    adminUserId: {
      type: String,
      required: true
    },
    targetUserId: {
      type: String,
      required: true
    },
    action: {
      type: String,
      enum: [
        "DOCTOR_APPROVED",
        "DOCTOR_REJECTED",
        "DOCTOR_CHANGES_REQUESTED",
        "USER_SUSPENDED",
        "USER_ACTIVATED"
      ],
      required: true
    },
    reason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

const AdminAction = mongoose.model("AdminAction", adminActionSchema);
export default AdminAction;

