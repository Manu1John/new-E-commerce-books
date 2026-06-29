import Cart from "../../models/Cart.js";
import Wishlist from "../../models/Wishlist.js";
import Product from "../../models/products.js";
import Category from "../../models/category.js";
import Address from "../../models/address.js";
import mongoose from "mongoose";

// Load user's cart
const getCart = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    let cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      populate: { path: "category" }
    });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    // Active Category check helper
    const activeCategories = await Category.find({ isDeleted: false, status: "active" }).select("_id");
    const activeCategoryIds = activeCategories.map((c) => c._id.toString());

    let hasUnavailableItems = false;
    let hasStockIssues = false;
    let items = [];
    let cartSubtotal = 0;

    for (let item of cart.items) {
      const product = item.product;
      let isUnavailable = false;
      let stockError = "";

      // Verify availability
      if (
        !product ||
        product.isDeleted ||
        product.status !== "active" ||
        !product.category ||
        product.category.isDeleted ||
        product.category.status !== "active" ||
        !activeCategoryIds.includes(product.category._id.toString())
      ) {
        isUnavailable = true;
        hasUnavailableItems = true;
      } else {
        // Verify stock
        if (product.quantity === 0) {
          stockError = "Out of Stock";
          hasStockIssues = true;
        } else if (item.quantity > product.quantity) {
          stockError = `Only ${product.quantity} units available`;
          hasStockIssues = true;
        } else {
          cartSubtotal += product.price * item.quantity;
        }
      }

      items.push({
        product: product,
        quantity: item.quantity,
        isUnavailable,
        stockError,
        itemTotal: product ? product.price * item.quantity : 0
      });
    }

    // FIX: Changed from quantity sum to array length (unique items)
    const cartCount = cart.items.length;

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

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const { productId, quantity: qtyInput } = req.body;
    const quantity = parseInt(qtyInput) || 1;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product selection." });
    }

    // 1. Fetch product & populate category
    const product = await Product.findById(productId).populate("category");

    // 2. Perform backend protection checks
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

    if (product.quantity <= 0) {
      return res.status(400).json({ success: false, error: "Product is out of stock." });
    }

    // 3. Find or create Cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    let newQuantity = quantity;

    if (existingIndex > -1) {
      newQuantity += cart.items[existingIndex].quantity;
    }

    // Capping max quantity to 10 or stock
    const maxQtyLimit = Math.min(10, product.quantity);
    if (newQuantity > maxQtyLimit) {
      return res.status(400).json({
        success: false,
        error: `Cannot add more units. Max quantity limit is ${maxQtyLimit} (Available: ${product.quantity}).`
      });
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity: newQuantity });
    }

    await cart.save();

    // 4. Wishlist integration: Automatically remove the item from the wishlist
    await Wishlist.updateOne({ user: userId }, { $pull: { products: productId } });

    // FIX: Changed from quantity sum to array length (unique items)
    const cartCount = cart.items.length;

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully.",
      cartCount
    });
  } catch (error) {
    console.error("ADD TO CART ERROR:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error." });
  }
};

// Increment/Decrement Quantity
const updateQuantity = async (req, res) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const { productId, action } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product selection." });
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted || product.status !== "active") {
      return res.status(400).json({ success: false, error: "This product is unavailable." });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(400).json({ success: false, error: "Cart not found." });
    }

    const existingIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (existingIndex === -1) {
      return res.status(400).json({ success: false, error: "Item not in cart." });
    }

    let currentQty = cart.items[existingIndex].quantity;
    if (action === "increment") {
      currentQty += 1;
      const maxLimit = Math.min(10, product.quantity);
      if (currentQty > maxLimit) {
        return res.status(400).json({
          success: false,
          error: `Cannot increment. Max limit is ${maxLimit} units.`
        });
      }
    } else if (action === "decrement") { 
      currentQty -= 1;
      if (currentQty < 1) {
        return res.status(400).json({ success: false, error: "Minimum quantity is 1." });
      }
    } else {
      return res.status(400).json({ success: false, error: "Invalid action." });
    }

    cart.items[existingIndex].quantity = currentQty;
    await cart.save();

    // Recalculate totals
    const updatedCart = await Cart.findOne({ user: userId }).populate("items.product");
    
    // FIX: Changed from quantity sum to array length (unique items)
    const cartCount = updatedCart.items.length;
    
    let cartSubtotal = 0;
    for (let item of updatedCart.items) {
      if (item.product && !item.product.isDeleted && item.product.status === "active") {
        cartSubtotal += item.product.price * item.quantity;
      }
    }

    return res.status(200).json({
      success: true,
      cartCount,
      cartSubtotal,
      itemTotal: product.price * currentQty,
      quantity: currentQty
    });
  } catch (error) {
    console.error("UPDATE QTY ERROR:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error." });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product." });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(400).json({ success: false, error: "Cart not found." });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();

    // Recalculate
    const updatedCart = await Cart.findOne({ user: userId }).populate("items.product");
    
    // FIX: Changed from quantity sum to array length (unique items)
    const cartCount = updatedCart.items.length;
    
    let cartSubtotal = 0;
    for (let item of updatedCart.items) {
      if (item.product && !item.product.isDeleted && item.product.status === "active") {
        cartSubtotal += item.product.price * item.quantity;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Item removed from cart.",
      cartCount,
      cartSubtotal
    });
  } catch (error) {
    console.error("REMOVE CART ITEM ERROR:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error." });
  }
};

// GET Checkout page
const getCheckout = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      populate: { path: "category" }
    });

    if (!cart || cart.items.length === 0) {
      req.flash("error", "Your cart is empty. Add products to checkout.");
      return res.redirect("/cart");
    }

    // Active Category check
    const activeCategories = await Category.find({ isDeleted: false, status: "active" }).select("_id");
    const activeCategoryIds = activeCategories.map((c) => c._id.toString());

    // Validate checkout restrictions
    for (let item of cart.items) {
      const product = item.product;
      if (
        !product ||
        product.isDeleted ||
        product.status !== "active" ||
        !product.category ||
        product.category.isDeleted ||
        product.category.status !== "active" ||
        !activeCategoryIds.includes(product.category._id.toString())
      ) {
        req.flash("error", "Checkout disabled. Some items in your cart are currently unavailable.");
        return res.redirect("/cart");
      }

      if (product.quantity === 0) {
        req.flash("error", `Checkout disabled. "${product.title}" is out of stock.`);
        return res.redirect("/cart");
      }

      if (item.quantity > product.quantity) {
        req.flash("error", `Checkout disabled. "${product.title}" quantity exceeds available stock.`);
        return res.redirect("/cart");
      }
    }

    // Load addresses
    const addresses = await Address.find({ userId });
    let cartSubtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return res.render("user/checkout", {
      title: "Checkout Order",
      items: cart.items,
      cartSubtotal,
      addresses,
      user: req.session.user,
      // FIX: Changed from quantity sum to array length (unique items)
      cartCount: cart.items.length
    });
  } catch (error) {
    console.error("GET CHECKOUT ERROR:", error);
    next(error);
  }
};

// Place Order (Mock checkout order execution)
const placeOrder = async (req, res) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({ success: false, error: "Please select a delivery address." });
    }

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty." });
    }

    // Revalidate stock during checkout process (Backend-level protection)
    for (let item of cart.items) {
      const product = item.product;
      if (!product || product.isDeleted || product.status !== "active") {
        return res.status(400).json({
          success: false,
          error: "Checkout failed. Some items in your cart are no longer available."
        });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Checkout failed. "${product.title}" does not have enough stock remaining.`
        });
      }
    }

    // Reduce product stock quantities
    for (let item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { quantity: -item.quantity }
      });
    }

    // Clear cart items
    cart.items = [];
    await cart.save();

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