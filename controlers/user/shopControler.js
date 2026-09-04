import Products from "../../models/products.js";
import { 
  getListingParamsService, 
  getCartCountService, 
  getWishlistCountService 
} from "../../services/user/homeService.js";
import { attachPricingToProducts } from "../../services/user/pricingService.js";

const shopControler = {
  getShopPage: async (req, res, next) => {
    try {
      const { baseCondition, sort, activeCategories } = await getListingParamsService(req.query);
      
      const page = parseInt(req.query.page) || 1;
      const limit = 12; // 12 products per page on shop page
      const skip = (page - 1) * limit;

      const productDocs = await Products.find(baseCondition)
        .populate("category")
        .sort(sort)
        .skip(skip)
        .limit(limit);
        
      const products = await attachPricingToProducts(productDocs);
      
      const totalProducts = await Products.countDocuments(baseCondition);
      const totalPages = Math.ceil(totalProducts / limit) || 1;
      
      const pagination = {
        totalItems: totalProducts,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      };

      const userId = req.session?.user?._id || req.session?.user?.id;
      const cartCount = await getCartCountService(userId);
      const wishlistCount = await getWishlistCountService(userId);

      res.render("user/shop", {
        user: req.session?.user,
        products,
        pagination,
        categories: activeCategories,
        query: req.query,
        cartCount,
        wishlistCount,
        buildPageUrl: (paramName, paramValue) => {
          const urlParams = new URLSearchParams(req.query);
          urlParams.set(paramName, paramValue);
          return `?${urlParams.toString()}`;
        }
      });
      
    } catch (error) {
      console.error("GET SHOP PAGE ERROR:", error);
      next(error);
    }
  }
};

export default shopControler;
