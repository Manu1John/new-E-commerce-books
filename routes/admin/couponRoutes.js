import express from "express";
import couponControler from "../../controlers/admin/couponControler.js";
import { disableCache, isAuthenticated } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/coupons", disableCache, isAuthenticated, couponControler.getCoupons);
router.post("/coupons", isAuthenticated, couponControler.createCoupon);
router.delete("/coupons/:id", isAuthenticated, couponControler.deleteCoupon);

export default router;
