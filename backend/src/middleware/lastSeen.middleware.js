import User from "../models/User.js";

export const updateLastSeen = async (req, res, next) => {
  if (req.user) {
    try {
      // Update lastSeen for authenticated user
      await User.findByIdAndUpdate(req.user._id, {
        lastSeen: new Date()
      });
    } catch (error) {
      console.error("Error updating lastSeen:", error);
      // Don't block the request if lastSeen update fails
    }
  }
  next();
};