import Wishlist from "../../models/Wishlist.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/products.js";
import Category from "../../models/category.js";

export async function getWishlistService({userId}){
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
    return {
        products,
        cartCount
    }
}
export async function addToWishlistService(productId, { userId }) {
  // 1. Fetch the product and populate its category
  const product = await Product.findById(productId).populate("category");

  // 2. Validate product availability
  // If the product or category doesn't exist, is deleted, or is inactive, reject it.
  const isProductValid = 
    product &&
    !product.isDeleted &&
    product.status === "active" &&
    product.category &&
    !product.category.isDeleted &&
    product.category.status === "active";

  if (!isProductValid) {
    return { product: null, alreadyInWishlist: false };
  }

  // 3. Fetch the user's wishlist
  let wishlist = await Wishlist.findOne({ user: userId });
  let alreadyInWishlist = false;
  const targetProductId = String(productId); // Ensure it's a primitive string

  if (!wishlist) {
    // 4. Create new wishlist if it doesn't exist
    wishlist = new Wishlist({ user: userId, products: [productId] });
    await wishlist.save();
  } else {
    // 5. Bulletproof check to see if the product is already in the wishlist array
    alreadyInWishlist = wishlist.products.some((item) => {
      // String(item) converts Mongoose ObjectIds to standard strings safely
      return String(item) === targetProductId || String(item._id) === targetProductId; 
    });

    // 6. Push and save ONLY if it's not already in the wishlist
    if (!alreadyInWishlist) {
      wishlist.products.push(productId);
      await wishlist.save();
    }
  }

  return {
    product,
    alreadyInWishlist
  };
}
export async function removeFromWishlistService(productId,{userId}){
    let wishlist = await Wishlist.findOne({ user: userId });
    wishlist.products = wishlist.products.filter((pId) =>
         pId.toString() !== productId);
    await wishlist.save();
    return wishlist
}