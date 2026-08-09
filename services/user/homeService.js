import Products from "../../models/products.js";
import Category from "../../models/category.js";
import Cart from "../../models/Cart.js";
import Wishlist from "../../models/Wishlist.js";
import mongoose from "mongoose";

// Helper to build search, filter, and sort queries
export const getListingParamsService = async (query) => {
  const searchQuery = query.search ? query.search.trim() : "";
  const categoryId = query.category ? query.category : "";
  const minPrice = query.minPrice ? Number(query.minPrice) : 0;
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : Infinity;
  const sortOption = query.sort ? query.sort : "";

  // 1. Get all active and non-deleted categories (Backend-level protection)
  const activeCategories = await Category.find({ isDeleted: false, status: "active" });
  const activeCategoryIds = activeCategories.map((c) => c._id.toString());

  // 2. Base query condition
  const baseCondition = {
    isDeleted: false,
    status: "active",
  };

  // If a category filter is active, check if it's valid/active
  if (categoryId) {
    if (activeCategoryIds.includes(categoryId)) {
      baseCondition.category = categoryId;
    } else {
      // Invalidate query if category is deleted/inactive
      baseCondition.category = new mongoose.Types.ObjectId();
    }
  } else {
    // Only include products from active categories
    baseCondition.category = { $in: activeCategoryIds };
  }

  // 3. Search query
  if (searchQuery) {
    baseCondition.$or = [
      { title: { $regex: searchQuery, $options: "i" } },
      { author: { $regex: searchQuery, $options: "i" } },
      { description: { $regex: searchQuery, $options: "i" } }
    ];
  }

  // 4. Price range filter
  if (minPrice > 0 || maxPrice < Infinity) {
    baseCondition.price = {};
    if (minPrice > 0) baseCondition.price.$gte = minPrice;
    if (maxPrice < Infinity) baseCondition.price.$lte = maxPrice;
  }

  // 5. Sorting
  let sort = { createdAt: -1 }; // Default newest
  if (sortOption === "price_asc") {
    sort = { price: 1 };
  } else if (sortOption === "price_desc") {
    sort = { price: -1 };
  } else if (sortOption === "az") {
    sort = { title: 1 };
  } else if (sortOption === "za") {
    sort = { title: -1 };
  }

  return { baseCondition, sort, activeCategories, activeCategoryIds };
};

export const getIndexAndHomeProductsService = async (query) => {
  const standardLimit = 4;
  const { baseCondition, sort, activeCategories } = await getListingParamsService(query);

  // ================= 1. POPULAR BOOKS ("ALL" TAB PAGINATION) =================
  const allPage = parseInt(query.page_all) || 1;
  const allSkip = (allPage - 1) * standardLimit;

  const allProducts = await Products.find(baseCondition)
    .populate("category")
    .sort(sort)
    .skip(allSkip)
    .limit(standardLimit);

  const totalAll = await Products.countDocuments(baseCondition);
  const allTotalPages = Math.ceil(totalAll / standardLimit) || 1;

  const paginationAll = {
    totalItems: totalAll,
    totalPages: allTotalPages,
    currentPage: allPage,
    hasNextPage: allPage < allTotalPages,
    hasPreviousPage: allPage > 1,
  };

  // ================= 2. POPULAR BOOKS (INDIVIDUAL CATEGORY PAGINATION) =================
  const categoryData = await Promise.all(
    activeCategories.map(async (cat) => {
      const page = parseInt(query[`page_${cat._id}`]) || 1;
      const skip = (page - 1) * standardLimit;

      const catCondition = {
        ...baseCondition,
        category: cat._id,
      };

      const products = await Products.find(catCondition)
        .populate("category")
        .sort(sort)
        .skip(skip)
        .limit(standardLimit);

      const total = await Products.countDocuments(catCondition);

      return {
        category: cat,
        products,
        page,
        totalPages: Math.ceil(total / standardLimit) || 1,
      };
    })
  );

  // ================= 3. FEATURED BOOKS PAGINATION =================
  const featuredPage = parseInt(query.page_featured) || 1;
  const featuredSkip = (featuredPage - 1) * standardLimit;

  const featuredProducts = await Products.find(baseCondition)
    .sort({ createdAt: -1 })
    .skip(featuredSkip)
    .limit(standardLimit);

  const totalFeatured = await Products.countDocuments(baseCondition);
  const featuredTotalPages = Math.ceil(totalFeatured / standardLimit) || 1;

  // ================= 4. SPECIAL OFFERS PAGINATION =================
  const offerPage = parseInt(query.page_offer) || 1;
  const offerSkip = (offerPage - 1) * standardLimit;

  const offerCondition = {
    ...baseCondition,
  };

  const offerProducts = await Products.find(offerCondition)
    .sort({ price: 1 })
    .skip(offerSkip)
    .limit(standardLimit);

  const totalOffers = await Products.countDocuments(offerCondition);
  const offerTotalPages = Math.ceil(totalOffers / standardLimit) || 1;

  return {
    allProducts,
    allPage,
    allTotalPages,
    paginationAll,
    categoryData,
    featuredProducts,
    featuredPage,
    featuredTotalPages,
    offerProducts,
    offerPage,
    offerTotalPages
  };
};

export const getCartCountService = async (userId) => {
  if (!userId) return 0;
  let cartCount = 0;
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }
  return cartCount;
  
};

// Add this new function below getCartCountService
export const getWishlistCountService = async (userId) => {
  if (!userId) return 0;
  let wishlistCount = 0;
  const wishlist = await Wishlist.findOne({ user: userId });
  if (wishlist && wishlist.products) {
    wishlistCount = wishlist.products.length;
  }
  return wishlistCount;
};

export const getProductDetailsService = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return { success: false, error: "Invalid Product ID." };
  }

  const product = await Products.findById(productId).populate("category");

  if (!product || product.isDeleted || product.status !== "active" || !product.category || product.category.isDeleted || product.category.status !== "active") {
    return { success: false, error: "The requested product is currently unavailable." };
  }

  const relatedProducts = await Products.find({
    category: product.category._id,
    _id: { $ne: product._id },
    isDeleted: false,
    status: "active"
  }).limit(4);

  return { success: true, product, relatedProducts };
};