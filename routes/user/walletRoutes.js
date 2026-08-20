import express from "express";
import walletControler from "../../controlers/user/walletControler.js";
import { authenticatedUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/wallet", authenticatedUser, walletControler.getWallet);

// New Routes for Modals
router.post("/wallet/add-money", authenticatedUser, walletControler.addMoney);
router.post("/wallet/withdraw", authenticatedUser, walletControler.withdraw);

export default router;