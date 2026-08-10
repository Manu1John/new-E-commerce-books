import express from "express";
import {
  getAllOrders,
  getAdminOrderDetails,
  updateOrderStatus
} from "../../controlers/admin/orderControler.js";
import { isAuthenticated, disableCache } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Get all orders (with search/pagination)
router.get("/admin/orders", isAuthenticated, disableCache, getAllOrders);

// Get specific order details
router.get("/admin/orders/:id", isAuthenticated, disableCache, getAdminOrderDetails);

// Update order status
router.post("/admin/orders/:id/status", isAuthenticated, updateOrderStatus);

export default router;
