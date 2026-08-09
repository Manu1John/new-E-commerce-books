import { 
  getIndexAndHomeProductsService, 
  getCartCountService, 
  getProductDetailsService,
  getWishlistCountService
} from "../../services/user/homeService.js"; // Adjust the path as needed

// URL parameters helper for pagination and tabs
const buildPageUrl = (query, paramName, paramValue, hash = "", activeTab = "") => {
  const urlParams = new URLSearchParams(query);
  urlParams.set(paramName, paramValue);
  if (activeTab) {
    urlParams.set("activeTab", activeTab);
  }
  return `?${urlParams.toString()}${hash}`;
};

const getuserIndex = async (req, res) => {
  try {
    if (req.session?.user) {
      return res.redirect("/home");
    }

    const data = await getIndexAndHomeProductsService(req.query);

    return res.render("user/index", {
      allProducts: data.allProducts,
      allPage: data.allPage,
      allTotalPages: data.allTotalPages,
      paginationAll: data.paginationAll,
      categoryData: data.categoryData,
      products: data.featuredProducts,
      featuredPage: data.featuredPage,
      featuredTotalPages: data.featuredTotalPages,
      offerProducts: data.offerProducts,
      offerPage: data.offerPage,
      offerTotalPages: data.offerTotalPages,
      query: req.query,
      activeTabId: req.query.activeTab || "all",
      getPageUrl: (paramName, paramValue, hash = "", activeTab = "") => 
        buildPageUrl(req.query, paramName, paramValue, hash, activeTab)
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

    const data = await getIndexAndHomeProductsService(req.query);
    
    const userId = req.session?.user?._id || req.session?.user?.id;
    
    // Fetch both cart and wishlist counts
    const cartCount = await getCartCountService(userId);
    const wishlistCount = await getWishlistCountService(userId);

    return res.render("user/home", {
      user: req.session.user,
      allProducts: data.allProducts,
      allPage: data.allPage,
      allTotalPages: data.allTotalPages,
      paginationAll: data.paginationAll,
      categoryData: data.categoryData,
      products: data.featuredProducts,
      featuredPage: data.featuredPage,
      featuredTotalPages: data.featuredTotalPages,
      offerProducts: data.offerProducts,
      offerPage: data.offerPage,
      offerTotalPages: data.offerTotalPages,
      query: req.query,
      cartCount,
      wishlistCount, // Passing wishlistCount to the view
      
      activeTabId: req.query.activeTab || "all",
      getPageUrl: (paramName, paramValue, hash = "", activeTab = "") => 
        buildPageUrl(req.query, paramName, paramValue, hash, activeTab)
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
    
    const serviceResult = await getProductDetailsService(productId);

    if (!serviceResult.success) {
      req.flash("error", serviceResult.error);
      return res.redirect(req.session?.user ? "/home" : "/");
    }

    const userId = req.session?.user?._id || req.session?.user?.id;
    
    // Fetch both cart and wishlist counts
    const cartCount = await getCartCountService(userId);
    const wishlistCount = await getWishlistCountService(userId);

    return res.render("user/productDetails", {
      title: serviceResult.product.title,
      product: serviceResult.product,
      relatedProducts: serviceResult.relatedProducts,
      user: req.session?.user,
      cartCount,
      wishlistCount, // Passing wishlistCount to the view
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