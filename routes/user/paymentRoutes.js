import express from "express";
import paymentControler from "../../controlers/user/paymentControler.js";
import { authenticatedUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/payment/create-order", authenticatedUser, paymentControler.createOrder);
router.post("/payment/verify", authenticatedUser, paymentControler.verifyPayment);
router.post("/payment/failure-callback", authenticatedUser, paymentControler.paymentFailureCallback);
router.get("/payment/success", authenticatedUser, paymentControler.paymentSuccess);
router.get("/payment/failure", authenticatedUser, paymentControler.paymentFailure);

export default router;
