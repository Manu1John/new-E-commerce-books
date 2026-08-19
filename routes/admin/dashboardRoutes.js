import express from "express";
import { getAdminDashboard } from '../../controlers/admin/dashboardController.js'
// import { adminAuthMiddleware } from "../../middlewares/auth.js"; // Attach your session guard here
import { disableCache,isAuthenticated } from "../../middleware/authMiddleware.js";
const router = express.Router();

router.get("/dashboard",disableCache, isAuthenticated, getAdminDashboard);

export default router;