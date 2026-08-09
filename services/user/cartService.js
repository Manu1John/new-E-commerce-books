import Cart from "../../models/Cart.js";
import Wishlist from "../../models/Wishlist.js";
import Product from "../../models/products.js";
import Category from "../../models/category.js";
import Address from "../../models/address.js";
import mongoose from "mongoose";
// Ensure you import your models: Product, Cart, Category, Address
export async function getCartService({userId}) {
    const cart = await Cart.findOne({user:userId}).populate({
      path: "items.product",
      populate: { path: "category" }
    })
    if(!cart){
        cart = new Cart({user:userId,items:[]})
        await cart.save()
    }
   const activeCategories = await Category.find({ 
    isDeleted: false, status: "active" }).select("_id");
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
    return{
        items,
      cartSubtotal,
      hasUnavailableItems,
      hasStockIssues,
      cartCount,
    }
     
}

// Assuming you import your models: Product, Cart, Wishlist

export async function AddToCartService({ userId, productId, quantity }) {
  // 1. Fetch product & populate category
  const product = await Product.findById(productId).populate("category");

  // 2. Perform backend protection checks FIRST
  if (
    !product ||
    product.isDeleted ||
    product.status !== "active" ||
    !product.category ||
    product.category.isDeleted ||
    product.category.status !== "active"
  ) {
    return { success: false, error: "This product is currently unavailable." };
  }

  if (product.quantity <= 0) {
    return { success: false, error: "Product is out of stock." };
  }

  // 3. Find or create Cart
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const existingIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  let newQuantity = quantity;

  // If item already exists, calculate the combined quantity
  if (existingIndex > -1) {
    newQuantity += cart.items[existingIndex].quantity;
  }

  // 4. Check quantity limits against stock and maximum cap
  const maxQtyLimit = Math.min(10, product.quantity);
  if (newQuantity > maxQtyLimit) {
    return {
      success: false,
      error: `Cannot add more units. Max quantity limit is ${maxQtyLimit} (Available: ${product.quantity}).`
    };
  }

  // 5. Update cart
  if (existingIndex > -1) {
    cart.items[existingIndex].quantity = newQuantity;
  } else {
    cart.items.push({ product: productId, quantity: newQuantity });
  }
  
  await cart.save();

  // 6. Wishlist integration: Automatically remove the item from the wishlist
  await Wishlist.updateOne(
    { user: userId }, 
    { $pull: { products: productId } }
  );

  // Return the count of unique items in the cart
  const cartCount = cart.items.length;

  return { success: true, cartCount };
}

// Helper to recalculate cart subtotal and count
const calculateCartTotals = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  const cartCount = cart.items.length;
  let cartSubtotal = 0;

  for (let item of cart.items) {
    if (item.product && !item.product.isDeleted && item.product.status === "active") {
      cartSubtotal += item.product.price * item.quantity;
    }
  }
  return { cartCount, cartSubtotal, cart };
};

export const updateItemQuantityService = async ({ userId, productId, action }) => {
  const product = await Product.findById(productId);
  if (!product || product.isDeleted || product.status !== "active") {
    return { success: false, error: "This product is unavailable." };
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) return { success: false, error: "Cart not found." };

  const existingIndex = cart.items.findIndex((item) => item.product.toString() === productId);
  if (existingIndex === -1) return { success: false, error: "Item not in cart." };

  let currentQty = cart.items[existingIndex].quantity;

  if (action === "increment") {
    currentQty += 1;
    const maxLimit = Math.min(10, product.quantity);
    if (currentQty > maxLimit) {
      return { success: false, error: `Cannot increment. Max limit is ${maxLimit} units.` };
    }
  } else if (action === "decrement") {
    currentQty -= 1;
    if (currentQty < 1) {
      return { success: false, error: "Minimum quantity is 1." };
    }
  } else {
    return { success: false, error: "Invalid action." };
  }

  cart.items[existingIndex].quantity = currentQty;
  await cart.save();

  const { cartCount, cartSubtotal } = await calculateCartTotals(userId);

  return {
    success: true,
    cartCount,
    cartSubtotal,
    itemTotal: product.price * currentQty,
    quantity: currentQty
  };
};

export const removeItemFromCartService = async ({ userId, productId }) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) return { success: false, error: "Cart not found." };

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  await cart.save();

  const { cartCount, cartSubtotal } = await calculateCartTotals(userId);

  return { success: true, cartCount, cartSubtotal };
};

export const getCheckoutDetailsService = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    populate: { path: "category" }
  });

  if (!cart || cart.items.length === 0) {
    return { success: false, status: "EMPTY_CART", error: "Your cart is empty. Add products to checkout." };
  }

  const activeCategories = await Category.find({ isDeleted: false, status: "active" }).select("_id");
  const activeCategoryIds = activeCategories.map((c) => c._id.toString());

  for (let item of cart.items) {
    const product = item.product;
    if (
      !product || product.isDeleted || product.status !== "active" ||
      !product.category || product.category.isDeleted || product.category.status !== "active" ||
      !activeCategoryIds.includes(product.category._id.toString())
    ) {
      return { success: false, error: "Checkout disabled. Some items in your cart are currently unavailable." };
    }
    if (product.quantity === 0) {
      return { success: false, error: `Checkout disabled. "${product.title}" is out of stock.` };
    }
    if (item.quantity > product.quantity) {
      return { success: false, error: `Checkout disabled. "${product.title}" quantity exceeds available stock.` };
    }
  }

  const addresses = await Address.find({ userId });
  const cartSubtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return { success: true, items: cart.items, cartSubtotal, addresses, cartCount: cart.items.length };
};

export const placeOrderService = async ({ userId, addressId }) => {
  if (!addressId) return { success: false, error: "Please select a delivery address." };

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0) return { success: false, error: "Cart is empty." };

  // Revalidate stock
  for (let item of cart.items) {
    const product = item.product;
    if (!product || product.isDeleted || product.status !== "active") {
      return { success: false, error: "Checkout failed. Some items in your cart are no longer available." };
    }
    if (product.quantity < item.quantity) {
      return { success: false, error: `Checkout failed. "${product.title}" does not have enough stock remaining.` };
    }
  }

  // Use a transaction for safe stock reduction and cart clearing
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (let item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { quantity: -item.quantity } },
        { session }
      );
    }
    cart.items = [];
    await cart.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};