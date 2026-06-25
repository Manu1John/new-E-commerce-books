import Products from "../../models/products.js";
import Category from "../../models/category.js";
import Cart from "../../models/Cart.js";
import mongoose from "mongoose";

// Helper to build search, filter, and sort queries
const getListingParams = async (req) => {
  const searchQuery = req.query.search ? req.query.search.trim() : "";
  const categoryId = req.query.category ? req.query.category : "";
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : 0;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : Infinity;
  const sortOption = req.query.sort ? req.query.sort : "";

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

const getuserIndex = async (req, res) => {
  try {
    if (req.session?.user) {
      return res.redirect("/home");
    }

    const standardLimit = 4;
    const { baseCondition, sort, activeCategories } = await getListingParams(req);

    // ================= 1. POPULAR BOOKS ("ALL" TAB PAGINATION) =================
    const allPage = parseInt(req.query.page_all) || 1;
    const allSkip = (allPage - 1) * standardLimit;

    const allProducts = await Products.find(baseCondition)
      .populate("category")
      .sort(sort)
      .skip(allSkip)
      .limit(standardLimit);

    const totalAll = await Products.countDocuments(baseCondition);
    const allTotalPages = Math.ceil(totalAll / standardLimit) || 1;

    // Pagination Metadata
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
        const page = parseInt(req.query[`page_${cat._id}`]) || 1;
        const skip = (page - 1) * standardLimit;

        // Clone baseCondition and override category
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
    const featuredPage = parseInt(req.query.page_featured) || 1;
    const featuredSkip = (featuredPage - 1) * standardLimit;

    const featuredProducts = await Products.find(baseCondition)
      .sort({ createdAt: -1 })
      .skip(featuredSkip)
      .limit(standardLimit);

    const totalFeatured = await Products.countDocuments(baseCondition);
    const featuredTotalPages = Math.ceil(totalFeatured / standardLimit) || 1;

    // ================= 4. SPECIAL OFFERS PAGINATION =================
    const offerPage = parseInt(req.query.page_offer) || 1;
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

    return res.render("user/index", {
      allProducts,
      allPage,
      allTotalPages,
      paginationAll,
      categoryData,
      products: featuredProducts,
      featuredPage,
      featuredTotalPages,
      offerProducts,
      offerPage,
      offerTotalPages,
      query: req.query,
    });
  } catch (error) {
    console.error("GET USER INDEX ERROR:", error);
    return res.redirect("/");
  }
};

const getHome = async (req, res, next) => {
  try {
    if (!req.session?.user) {
      return res.redirect("/");
    }

    const standardLimit = 4;
    const { baseCondition, sort, activeCategories } = await getListingParams(req);

    // ================= 1. POPULAR BOOKS ("ALL GENRE" PAGINATION) =================
    const allPage = parseInt(req.query.page_all) || 1;
    const allSkip = (allPage - 1) * standardLimit;

    const allProducts = await Products.find(baseCondition)
      .populate("category")
      .sort(sort)
      .skip(allSkip)
      .limit(standardLimit);

    const totalAll = await Products.countDocuments(baseCondition);
    const allTotalPages = Math.ceil(totalAll / standardLimit) || 1;

    // Pagination Metadata
    const paginationAll = {
      totalItems: totalAll,
      totalPages: allTotalPages,
      currentPage: allPage,
      hasNextPage: allPage < allTotalPages,
      hasPreviousPage: allPage > 1,
    };

    // ================= 2. POPULAR BOOKS (CATEGORY WISE PAGINATION) =================
    const categoryData = await Promise.all(
      activeCategories.map(async (cat) => {
        const page = parseInt(req.query[`page_${cat._id}`]) || 1;
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
    const featuredPage = parseInt(req.query.page_featured) || 1;
    const featuredSkip = (featuredPage - 1) * standardLimit;

    const featuredProducts = await Products.find(baseCondition)
      .sort({ createdAt: -1 })
      .skip(featuredSkip)
      .limit(standardLimit);

    const totalFeatured = await Products.countDocuments(baseCondition);
    const featuredTotalPages = Math.ceil(totalFeatured / standardLimit) || 1;

    // ================= 4. SPECIAL OFFERS PAGINATION =================
    const offerPage = parseInt(req.query.page_offer) || 1;
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

    // Retrieve Cart items count
    let cartCount = 0;
    const userId = req.session?.user?._id || req.session?.user?.id;
    if (userId) {
      const cart = await Cart.findOne({ user: userId });
      if (cart) {
        cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      }
    }

    return res.render("user/home", {
      user: req.session.user,
      allProducts,
      allPage,
      allTotalPages,
      paginationAll,
      categoryData,
      products: featuredProducts,
      featuredPage,
      featuredTotalPages,
      offerProducts,
      offerPage,
      offerTotalPages,
      query: req.query,
      cartCount
    });
  } catch (error) {
    console.error("Error in getHome controller:", error);
    next(error);
  }
};

// GET PRODUCT DETAILS PAGE
const getProductDetails = async (req, res, next) => {
  try {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      req.flash("error", "Invalid Product ID.");
      return res.redirect(req.session?.user ? "/home" : "/");
    }

    // 1. Retrieve the product and populate category
    const product = await Products.findById(productId).populate("category");

    // 2. Perform backend verification for product and category status
    if (!product || product.isDeleted || product.status !== "active" || !product.category || product.category.isDeleted || product.category.status !== "active") {
      req.flash("error", "The requested product is currently unavailable.");
      return res.redirect(req.session?.user ? "/home" : "/");
    }

    // 3. Retrieve related products (same category, active, excluding this product)
    const relatedProducts = await Products.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isDeleted: false,
      status: "active"
    })
    .limit(4);

    // Retrieve cart item count if logged in
    let cartCount = 0;
    const userId = req.session?.user?._id || req.session?.user?.id;
    if (userId) {
      const cart = await Cart.findOne({ user: userId });
      if (cart) {
        cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      }
    }

    return res.render("user/productDetails", {
      title: product.title,
      product,
      relatedProducts,
      user: req.session?.user,
      cartCount,
      success: req.flash("success"),
      error: req.flash("error")
    });

  } catch (error) {
    console.error("GET PRODUCT DETAILS ERROR:", error);
    next(error);
  }
};

export default {
  getuserIndex,
  getHome,
  getProductDetails
};