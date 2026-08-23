import express from "express";
import {
  getUserOrders,
  getOrderDetails,
  getOrderSuccess,
  cancelOrder,
  cancelOrderItem,
  returnOrder,
  downloadInvoice
} from "../../controlers/user/orderControler.js";
import { authenticatedUser, disableCache } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Get order history
router.get("/orders", authenticatedUser, disableCache, getUserOrders);

router.get("/orders/success/:id", authenticatedUser, disableCache, getOrderSuccess);

// Get specific order details
router.get("/orders/:id", authenticatedUser, disableCache, getOrderDetails);

// Cancel an order
router.post("/orders/:id/cancel", authenticatedUser, cancelOrder);

// Cancel a single order item
router.post("/orders/:id/items/:itemId/cancel", authenticatedUser, cancelOrderItem);

// Return an order
router.post("/orders/:id/return", authenticatedUser, returnOrder);

// Download PDF invoice
router.get("/orders/:id/invoice", authenticatedUser, downloadInvoice);

export default router;
