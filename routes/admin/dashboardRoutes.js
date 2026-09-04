import express from "express";
import { getAdminDashboard, getTopProducts } from '../../controlers/admin/dashboardController.js'
// import { adminAuthMiddleware } from "../../middlewares/auth.js"; // Attach your session guard here
import { disableCache,isAuthenticated } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard",disableCache, isAuthenticated, getAdminDashboard);
router.get("/dashboard/top-products", disableCache, isAuthenticated, getTopProducts);

export default router;