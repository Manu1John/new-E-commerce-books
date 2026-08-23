import express from "express";
import { addReview, updateReview, deleteReview } from "../../controlers/user/reviewController.js";
import { authenticatedUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/review/add", authenticatedUser, addReview);
router.put("/review/edit/:id", authenticatedUser, updateReview);
router.delete("/review/delete/:id", authenticatedUser, deleteReview);

export default router;
