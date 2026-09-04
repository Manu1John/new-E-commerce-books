import express from 'express';
import shopControler from '../../controlers/user/shopControler.js';
import { disableCache } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/shop", disableCache, shopControler.getShopPage);

export default router;
