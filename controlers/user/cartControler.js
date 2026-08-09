
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

    return res.render("user/checkout", {
      title: "Checkout Order",
      items: result.items,
      cartSubtotal: result.cartSubtotal,
      addresses: result.addresses,
      user: req.session.user,
      cartCount: result.cartCount
    });
  } catch (error) {
    console.error("GET CHECKOUT ERROR:", error);
    next(error);
  }
};

export const placeOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { addressId } = req.body;

    const result = await placeOrderService({ userId, addressId });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    req.flash("success", "Your order has been placed successfully! Thank you for purchasing.");

    return res.status(200).json({
      success: true,
      message: "Order placed successfully!",
      redirectUrl: "/profile/user"
    });
  } catch (error) {
    console.error("PLACE ORDER ERROR:", error);
    return res.status(500).json({ success: false, error: "Failed to place your order. Please try again." });
  }
};

export default {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  getCheckout,
  placeOrder
};