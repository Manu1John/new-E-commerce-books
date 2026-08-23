import Products from "../../models/products.js";
import Category from "../../models/category.js";
import Cart from "../../models/Cart.js";
import Wishlist from "../../models/Wishlist.js";
import Review from "../../models/Review.js";
import Order from "../../models/Order.js";
import mongoose from "mongoose";
import { attachPricingToProduct, attachPricingToProducts } from "./pricingService.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getListingParamsService = async (query) => {
  const searchQuery = query.search ? query.search.trim() : "";
  const categoryId = query.category ? query.category : "";
  const minPrice = query.minPrice ? Number(query.minPrice) : 0;
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : Infinity;
  const sortOption = query.sort ? query.sort : "";

  const activeCategories = await Category.find({ isDeleted: false, status: "active" });
  const activeCategoryIds = activeCategories.map((c) => c._id.toString());

  const baseCondition = {
    isDeleted: false,
    status: "active",
  };

  if (categoryId) {
    if (activeCategoryIds.includes(categoryId)) {
      baseCondition.category = categoryId;
    } else {
      baseCondition.category = new mongoose.Types.ObjectId();
    }
  } else {
    baseCondition.category = { $in: activeCategoryIds };
  }

  if (searchQuery) {
    const safeSearch = escapeRegex(searchQuery);
    baseCondition.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { author: { $regex: safeSearch, $options: "i" } },
      { publisher: { $regex: safeSearch, $options: "i" } },
      { isbn: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } }
    ];
  }

  if (minPrice > 0 || maxPrice < Infinity) {
    baseCondition.price = {};
    if (minPrice > 0) baseCondition.price.$gte = minPrice;
    if (maxPrice < Infinity) baseCondition.price.$lte = maxPrice;
  }

  let sort = { createdAt: -1 }; 
  if (sortOption === "price_asc") sort = { price: 1 };
  else if (sortOption === "price_desc") sort = { price: -1 };
  else if (sortOption === "az") sort = { title: 1 };
  else if (sortOption === "za") sort = { title: -1 };

  return { baseCondition, sort, activeCategories, activeCategoryIds };
};

export const getIndexAndHomeProductsService = async (query) => {
  const standardLimit = 4;
  const { baseCondition, sort, activeCategories } = await getListingParamsService(query);

  const allPage = parseInt(query.page_all) || 1;
  const allSkip = (allPage - 1) * standardLimit;

  const allProductDocs = await Products.find(baseCondition)
    .populate("category")
    .sort(sort)
    .skip(allSkip)
    .limit(standardLimit);
  const allProducts = await attachPricingToProducts(allProductDocs);

  const totalAll = await Products.countDocuments(baseCondition);
  const allTotalPages = Math.ceil(totalAll / standardLimit) || 1;

  const paginationAll = {
    totalItems: totalAll,
    totalPages: allTotalPages,
    currentPage: allPage,
    hasNextPage: allPage < allTotalPages,
    hasPreviousPage: allPage > 1,
  };

  const categoryData = await Promise.all(
    activeCategories.map(async (cat) => {
      const page = parseInt(query[`page_${cat._id}`]) || 1;
      const skip = (page - 1) * standardLimit;
      const catCondition = { ...baseCondition, category: cat._id };

      const productDocs = await Products.find(catCondition).populate("category").sort(sort).skip(skip).limit(standardLimit);
      const products = await attachPricingToProducts(productDocs);
      const total = await Products.countDocuments(catCondition);

      return { category: cat, products, page, totalPages: Math.ceil(total / standardLimit) || 1 };
    })
  );

  const featuredPage = parseInt(query.page_featured) || 1;
  const featuredSkip = (featuredPage - 1) * standardLimit;

  const featuredProductDocs = await Products.find(baseCondition).populate("category").sort({ createdAt: -1 }).skip(featuredSkip).limit(standardLimit);
  const featuredProducts = await attachPricingToProducts(featuredProductDocs);

  const totalFeatured = await Products.countDocuments(baseCondition);
  const featuredTotalPages = Math.ceil(totalFeatured / standardLimit) || 1;

  const offerPage = parseInt(query.page_offer) || 1;
  const offerSkip = (offerPage - 1) * standardLimit;

  const offerProductDocs = await Products.find({ ...baseCondition }).populate("category").sort({ price: 1 }).skip(offerSkip).limit(standardLimit);
  const offerProductsAll = await attachPricingToProducts(offerProductDocs);
  const offerProducts = offerProductsAll.filter((product) => product.pricing.discountPercentage > 0);

  const totalOffers = await Products.countDocuments({ ...baseCondition });
  const offerTotalPages = Math.ceil(totalOffers / standardLimit) || 1;

  return {
    allProducts, allPage, allTotalPages, paginationAll, categoryData,
    featuredProducts, featuredPage, featuredTotalPages,
    offerProducts, offerPage, offerTotalPages
  };
};

export const getCartCountService = async (userId) => {
  if (!userId) return 0;
  let cartCount = 0;
  const cart = await Cart.findOne({ user: userId });
  if (cart) cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  return cartCount;
};

export const getWishlistCountService = async (userId) => {
  if (!userId) return 0;
  let wishlistCount = 0;
  const wishlist = await Wishlist.findOne({ user: userId });
  if (wishlist && wishlist.products) wishlistCount = wishlist.products.length;
  return wishlistCount;
};

export const getProductDetailsService = async (productId, userId) => {
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

  // --- REVIEW FETCH & DISTRIBUTION LOGIC ---
  const reviews = await Review.find({ product: productId }).populate('user', 'firstName lastName profileImage').sort({ createdAt: -1 });
  
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;
  reviews.forEach(r => {
      distribution[r.rating]++;
      totalRating += r.rating;
  });
  const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

  // Eligibility & Duplication Check
  let canReview = false;
  let userReview = null;

  if (userId) {
      userReview = reviews.find(r => r.user._id.toString() === userId.toString());
      if (!userReview) {
          const hasPurchased = await Order.findOne({
              user: userId,
              "items.product": productId,
              $or: [{ status: "Delivered" }, { "items.status": "Delivered" }]
          });
          if (hasPurchased) canReview = true;
      }
  }

  return {
    success: true,
    product: await attachPricingToProduct(product),
    relatedProducts: await attachPricingToProducts(relatedProducts),
    reviews,
    reviewStats: { avgRating, total: reviews.length, distribution },
    canReview,
    userReview
  };
};