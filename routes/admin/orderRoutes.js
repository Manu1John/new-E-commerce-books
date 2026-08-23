import express from "express";
import {
  getAllOrders,
  getAdminOrderDetails,
  updateOrderStatus,
  updateOrderItemStatus,
  issueRefund,
  downloadInvoice
} from "../../controlers/admin/orderControler.js";
import { isAuthenticated, disableCache } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Get all orders (with search/pagination)
router.get("/orders", isAuthenticated, disableCache, getAllOrders);

// Get specific order details
router.get("/orders/:id", isAuthenticated, disableCache, getAdminOrderDetails);

// Update order status
router.post("/orders/:id/status", isAuthenticated, updateOrderStatus);

// Update specific order item status
router.patch("/orders/:orderId/item/:itemId/status", isAuthenticated, updateOrderItemStatus);

// Add these two new routes
router.post("/orders/:id/refund", isAuthenticated, issueRefund);
router.get("/orders/:id/invoice", isAuthenticated, downloadInvoice);

export default router;
