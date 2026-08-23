import { addReviewService, updateReviewService, deleteReviewService } from "../../services/user/reviewService.js";

export const addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.session.user._id || req.session.user.id;
        await addReviewService(userId, productId, Number(rating), comment);
        res.json({ success: true, message: "Review added successfully!" });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const updateReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const userId = req.session.user._id || req.session.user.id;
        await updateReviewService(userId, req.params.id, Number(rating), comment);
        res.json({ success: true, message: "Review updated successfully!" });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const userId = req.session.user._id || req.session.user.id;
        await deleteReviewService(userId, req.params.id);
        res.json({ success: true, message: "Review deleted successfully!" });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};