import express from "express";
import wishlistControler from "../../controlers/user/wishlistControler.js";
import { authenticatedUser, disableCache } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/wishlist", authenticatedUser, disableCache, wishlistControler.getWishlist);
router.post("/wishlist/add", authenticatedUser, wishlistControler.addToWishlist);
router.post("/wishlist/remove", authenticatedUser, wishlistControler.removeFromWishlist);

export default router;
