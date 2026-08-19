import express from "express";
import couponControler from "../../controlers/admin/couponControler.js";
import { disableCache, isAuthenticated } from "../../middleware/authMiddleware.js";

const router = express.Router();

// List
router.get("/coupons", disableCache, isAuthenticated, couponControler.getCoupons);

// Add
router.get("/coupons/add", disableCache, isAuthenticated, couponControler.getAddCoupon);
router.post("/coupons/add", isAuthenticated, couponControler.createCoupon);

// Edit
router.get("/coupons/edit/:id", disableCache, isAuthenticated, couponControler.getEditCoupon);
router.put("/coupons/edit/:id", isAuthenticated, couponControler.updateCoupon);

// Delete
router.delete("/coupons/:id", isAuthenticated, couponControler.deleteCoupon);

export default router;