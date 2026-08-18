import express from "express";
import walletControler from "../../controlers/user/walletControler.js";
import { authenticatedUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/wallet", authenticatedUser, walletControler.getWallet);

export default router;
