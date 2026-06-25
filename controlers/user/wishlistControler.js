import Wishlist from "../../models/Wishlist.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/products.js";
import Category from "../../models/category.js";
import mongoose from "mongoose";

// Load user's wishlist
const getWishlist = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    let wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "products",
      populate: { path: "category" }
    });

    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
      await wishlist.save();
    }

    // Active Category check
    const activeCategories = await Category.find({ isDeleted: false, status: "active" }).select("_id");
    const activeCategoryIds = activeCategories.map((c) => c._id.toString());

    // Filter out inactive/deleted products or products from inactive/deleted categories
    const products = wishlist.products.filter((product) => {
      return (
        product &&
        !product.isDeleted &&
        product.status === "active" &&
        product.category &&
        !product.category.isDeleted &&
        product.category.status === "active" &&
        activeCategoryIds.includes(product.category._id.toString())
      );
    });

    // Check cart count
    let cartCount = 0;
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    }

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

// Add product to wishlist
const addToWishlist = async (req, res) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product selection." });
    }

    // 1. Fetch product & verify active state
    const product = await Product.findById(productId).populate("category");
    if (
      !product ||
      product.isDeleted ||
      product.status !== "active" ||
      !product.category ||
      product.category.isDeleted ||
      product.category.status !== "active"
    ) {
      return res.status(400).json({ success: false, error: "This product is currently unavailable." });
    }

    // 2. Find or create Wishlist
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    if (wishlist.products.includes(productId)) {
      return res.status(200).json({ success: true, message: "Product is already in your wishlist." });
    }

    wishlist.products.push(productId);
    await wishlist.save();

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

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(400).json({ success: false, error: "Wishlist not found." });
    }

    wishlist.products = wishlist.products.filter((pId) => pId.toString() !== productId);
    await wishlist.save();

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
