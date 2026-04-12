import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import { joinWaitlist } from "../services/waitlist.service.js";

export const handleJoinWaitlist = asyncHandler(async (req, res) => {
  const waitlist = await joinWaitlist({
    ...req.body,
    patientId: req.user.userId
  });

  return sendResponse(res, 201, "Waitlist joined", waitlist);
});
