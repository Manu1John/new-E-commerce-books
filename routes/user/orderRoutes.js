import express from "express";
import {
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  returnOrder,
  downloadInvoice
} from "../../controlers/user/orderControler.js";
import { authenticatedUser, disableCache } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Get order history
router.get("/orders", authenticatedUser, disableCache, getUserOrders);

// Get specific order details
router.get("/orders/:id", authenticatedUser, disableCache, getOrderDetails);

// Cancel an order
router.post("/orders/:id/cancel", authenticatedUser, cancelOrder);

// Return an order
router.post("/orders/:id/return", authenticatedUser, returnOrder);

// Download PDF invoice
router.get("/orders/:id/invoice", authenticatedUser, downloadInvoice);

export default router;
