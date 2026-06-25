import express from "express";
import cartControler from "../../controlers/user/cartControler.js";
import { authenticatedUser, disableCache } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/cart", authenticatedUser, disableCache, cartControler.getCart);
router.post("/cart/add", authenticatedUser, cartControler.addToCart);
router.post("/cart/update", authenticatedUser, cartControler.updateQuantity);
router.post("/cart/remove", authenticatedUser, cartControler.removeFromCart);

router.get("/checkout", authenticatedUser, disableCache, cartControler.getCheckout);
router.post("/checkout/place", authenticatedUser, cartControler.placeOrder);

export default router;
