import express from "express";
import { signup, login, logout, updateProfile, saveSubscription } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { updateLastSeen } from "../middleware/lastSeen.middleware.js";

const router = express.Router();

// router.use(arcjetProtection);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateLastSeen, updateProfile);

router.post("/save-subscription", protectRoute, updateLastSeen, saveSubscription);

router.get("/check", protectRoute, updateLastSeen, (req, res) => res.status(200).json(req.user));

export default router;
