import Review from "../../models/Review.js";
import Products from "../../models/products.js";
import Order from "../../models/Order.js";

// Helper to recalculate and update the product's average rating
const updateProductRating = async (productId) => {
    const stats = await Review.aggregate([
        { $match: { product: productId } },
        { $group: { _id: '$product', avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }
    ]);
    
    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const totalReviews = stats.length > 0 ? stats[0].total : 0;
    
    await Products.findByIdAndUpdate(productId, { averageRating: avgRating, totalReviews: totalReviews });
};

export const addReviewService = async (userId, productId, rating, comment) => {
    // 1. Check if user purchased this item and it was delivered
    const hasPurchased = await Order.findOne({ 
        user: userId, 
        "items.product": productId, 
        $or: [{ status: "Delivered" }, { "items.status": "Delivered" }]
    });
    
    if (!hasPurchased) throw new Error("You can only review products you have purchased and received.");

    // 2. Check for duplicate review
    const existing = await Review.findOne({ user: userId, product: productId });
    if (existing) throw new Error("You have already reviewed this product.");

    const review = await Review.create({ user: userId, product: productId, rating, comment });
    await updateProductRating(productId);
    return review;
};

export const updateReviewService = async (userId, reviewId, rating, comment) => {
    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) throw new Error("Review not found or unauthorized.");
    
    review.rating = rating;
    review.comment = comment;
    await review.save();
    await updateProductRating(review.product);
    return review;
};

export const deleteReviewService = async (userId, reviewId) => {
    const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });
    if (!review) throw new Error("Review not found or unauthorized.");
    await updateProductRating(review.product);
    return true;
};