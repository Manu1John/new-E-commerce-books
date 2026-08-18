import express from "express";
import offerControler from "../../controlers/admin/offerControler.js";
import { disableCache, isAuthenticated } from "../../middleware/authMiddleware.js";

const router = express.Router();

// List Offers
router.get("/offers", disableCache, isAuthenticated, offerControler.getOffers);

// Create Offer
router.get("/offers/add", disableCache, isAuthenticated, offerControler.getCreateOffer);
router.post("/offers/add", isAuthenticated, offerControler.createOffer);

// Edit Offer
router.get("/offers/edit/:id", disableCache, isAuthenticated, offerControler.getEditOffer);
router.post("/offers/edit/:id", isAuthenticated, offerControler.postEditOffer);

// Delete Offer
router.delete("/offers/:id", isAuthenticated, offerControler.deleteOffer);

export default router;