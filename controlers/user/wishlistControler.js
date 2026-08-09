
import mongoose from "mongoose";
 import {getWishlistService,
  addToWishlistService,removeFromWishlistService
 } from '../../services/user/wishlistService.js'

// Load user's wishlist
const getWishlist = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const {products,cartCount } = await getWishlistService({userId})
   
    return res.render("user/wishlist", {
      title: "My Wishlist",
      products,
      cartCount,
      user: req.session.user,
      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error("GET WISHLIST ERROR:", error);
    next(error);
  }
};


export const addToWishlist = async (req, res) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Please log in to add items to your wishlist." });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product selection." });
    }

    const { product, alreadyInWishlist } = await addToWishlistService(productId, { userId });

    // 1. If the service returns null for the product, it failed the availability checks
    if (!product) {
      return res.status(400).json({ success: false, error: "This product is currently unavailable." });
    }

    // 2. If it's already in the wishlist
    if (alreadyInWishlist) {
      return res.status(200).json({ success: true, message: "Product is already in your wishlist." });
    }

    // 3. Success
    return res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully."
    });
  } catch (error) {
    console.error("ADD TO WISHLIST ERROR:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error." });
  }
};
// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product." });
    }

    const wishlist = await removeFromWishlistService(productId,{userId})
    if (!wishlist) {
      return res.status(400).json({ success: false, error: "Wishlist not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist."
    });
  } catch (error) {
    console.error("REMOVE WISHLIST ERROR:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error." });
  }
};

export default {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
