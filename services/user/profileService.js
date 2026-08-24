import User from "../../models/User.js";
import Order from "../../models/Order.js";
import Wishlist from "../../models/Wishlist.js";
import Review from "../../models/Review.js";

export const getUserProfileService= async(userId)=>{
    const user = await User.findById(userId);
    if (!user) return null;

    const orders = await Order.find({ user: userId });
    let booksOrdered = 0;
    orders.forEach(order => {
        booksOrdered += order.items.reduce((sum, item) => sum + item.quantity, 0);
    });

    const wishlist = await Wishlist.findOne({ user: userId });
    const wishlistItems = wishlist ? wishlist.products.length : 0;

    const reviewsPosted = await Review.countDocuments({ user: userId });

    return { user, booksOrdered, wishlistItems, reviewsPosted };
}

export const updateUserProfileService = async(userData,userId)=>{
           const {
                firstName,
                lastName,
                phone
            } = userData;
      const updateData = {
            firstName,
            lastName,
            phone
        };
    return  await User.findByIdAndUpdate(
            userId,
            updateData
        );
}


