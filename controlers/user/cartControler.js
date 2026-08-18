
import mongoose from "mongoose";
import {getCartService,
  updateItemQuantityService,
  removeItemFromCartService,
  getCheckoutDetailsService,
  placeOrderService,
  AddToCartService
} from "../../services/user/cartService.js"
// Load user's cart
const getCart = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const {  items,
      cartSubtotal,
      hasUnavailableItems,
      hasStockIssues,
      cartCount,} = await getCartService({userId})
    return res.render("user/cart", {
      title: "My Shopping Cart",
      items,
      cartSubtotal,
      hasUnavailableItems,
      hasStockIssues,
      cartCount,
      user: req.session.user,
      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error("GET CART ERROR:", error);
    next(error);
  }
};


export const addToCart = async (req, res) => {
  try {
    // 1. Extract and format inputs
    const userId = req.session?.user?._id || req.session?.user?.id;
    const { productId, quantity: qtyInput } = req.body;
    const quantity = parseInt(qtyInput) || 1;

    // Check authentication
    if (!userId) {
      return res.status(401).json({ success: false, error: "Please log in to add items to your cart." });
    }

    // Validate Product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product selection." });
    }

    // 2. Call the Service
    const result = await AddToCartService({ 
      userId, 
      productId, 
      quantity 
    });

    // 3. Handle Service Failures (e.g., out of stock, limits reached)
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }

    // 4. Handle Success
    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully.",
      cartCount: result.cartCount
    });

  } catch (error) {
    console.error("ADD TO CART ERROR:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error." });
  }
};
// Increment/Decrement Quantity


const getUserId = (req) => req.session?.user?._id || req.session?.user?.id;

export const updateQuantity = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { productId, action } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product selection." });
    }

    const result = await updateItemQuantityService({ userId, productId, action });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("UPDATE QTY ERROR:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error." });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product." });
    }

    const result = await removeItemFromCartService({ userId, productId });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({ ...result, message: "Item removed from cart." });
  } catch (error) {
    console.error("REMOVE CART ITEM ERROR:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error." });
  }
};

export const getCheckout = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await getCheckoutDetailsService(userId);

    if (!result.success) {
      req.flash("error", result.error);
      return res.redirect("/cart");
    }

    const Wallet = (await import("../../models/Wallet.js")).default;
    const wallet = await Wallet.findOne({ user: userId });
    const walletBalance = wallet ? wallet.balance : 0;

    return res.render("user/checkout", {
      title: "Checkout Order",
      items: result.items,
      cartSubtotal: result.cartSubtotal,
      addresses: result.addresses,
      user: req.session.user,
      cartCount: result.cartCount,
      walletBalance
    });
  } catch (error) {
    console.error("GET CHECKOUT ERROR:", error);
    next(error);
  }
};

export const placeOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { addressId } = req.body; // Matches the body sent from frontend

    // SAFETY CHECK: Prevent literal EJS strings or empty IDs from crashing Mongoose
    if (!addressId || addressId.includes('<%=')) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid or missing delivery address." 
      });
    }

    const result = await placeOrderService({ userId, addressId });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    req.flash("success", "Your order has been placed successfully! Thank you for purchasing.");

    return res.status(200).json({
      success: true,
      message: "Order placed successfully!",
      redirectUrl: "/home"
    });
  } catch (error) {
    console.error("PLACE ORDER ERROR:", error);
    return res.status(500).json({ success: false, error: "Failed to place your order. Please try again." });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { code } = req.body;
    
    if (!code) return res.status(400).json({ success: false, message: "Coupon code is required" });

    const Coupon = (await import("../../models/Coupon.js")).default;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.status(400).json({ success: false, message: "Invalid or expired coupon" });
    if (new Date() > coupon.expiryDate) return res.status(400).json({ success: false, message: "Coupon has expired" });
    if (coupon.usedBy.includes(userId)) return res.status(400).json({ success: false, message: "Coupon already used" });

    // Calculate cart total to check minPurchaseAmount and calculate discount
    const { getCheckoutDetailsService } = await import("../../services/user/cartService.js");
    const result = await getCheckoutDetailsService(userId);
    
    if (result.cartSubtotal < coupon.minPurchaseAmount) {
      return res.status(400).json({ success: false, message: `Minimum purchase amount is ₹${coupon.minPurchaseAmount}` });
    }

    let discountAmount = 0;
    if (coupon.discountType === "flat") {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === "percentage") {
      discountAmount = (result.cartSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    }

    return res.status(200).json({ 
      success: true, 
      couponId: coupon._id,
      discountAmount: Math.round(discountAmount) 
    });
  } catch (error) {
    console.error("APPLY COUPON ERROR:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  getCheckout,
  placeOrder,
  applyCoupon
};