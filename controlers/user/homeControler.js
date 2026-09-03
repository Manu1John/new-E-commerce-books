import { 
  getIndexAndHomeProductsService, 
  getCartCountService, 
  getProductDetailsService,
  getWishlistCountService
} from "../../services/user/homeService.js";
import Contact from "../../models/Contact.js";

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
      wishlistCount, 
      activeTabId: req.query.activeTab || "all",
      getPageUrl: (paramName, paramValue, hash = "", activeTab = "") => 
        buildPageUrl(req.query, paramName, paramValue, hash, activeTab)
    });
  } catch (error) {
    console.error("Error in getHome controller:", error);
    next(error);
  }
};

const getProductDetails = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const userId = req.session?.user?._id || req.session?.user?.id; // Grab userId
    
    const serviceResult = await getProductDetailsService(productId, userId); // Pass userId

    if (!serviceResult.success) {
      req.flash("error", serviceResult.error);
      return res.redirect(req.session?.user ? "/home" : "/");
    }
    
    const cartCount = await getCartCountService(userId);
    const wishlistCount = await getWishlistCountService(userId);

    return res.render("user/productDetails", {
      title: serviceResult.product.title,
      product: serviceResult.product,
      relatedProducts: serviceResult.relatedProducts,
      reviews: serviceResult.reviews,
      reviewStats: serviceResult.reviewStats,
      canReview: serviceResult.canReview,
      userReview: serviceResult.userReview,
      user: req.session?.user,
      cartCount,
      wishlistCount, 
      success: req.flash("success"),
      error: req.flash("error")
    });

  } catch (error) {
    console.error("GET PRODUCT DETAILS ERROR:", error);
    next(error);
  }
};

const getHelpCenter = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const cartCount = await getCartCountService(userId);
    const wishlistCount = await getWishlistCountService(userId);
    return res.render("user/help-center", {
      user: req.session?.user,
      cartCount,
      wishlistCount
    });
  } catch (error) {
    console.error("GET HELP CENTER ERROR:", error);
    next(error);
  }
};

const getContactUs = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id || req.session?.user?.id;
    const cartCount = await getCartCountService(userId);
    const wishlistCount = await getWishlistCountService(userId);
    return res.render("user/contact-us", {
      user: req.session?.user,
      cartCount,
      wishlistCount
    });
  } catch (error) {
    console.error("GET CONTACT US ERROR:", error);
    next(error);
  }
};

const postContactUs = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const newContact = new Contact({
      name,
      email,
      subject,
      message
    });

    await newContact.save();

    return res.status(200).json({ success: true, message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("POST CONTACT US ERROR:", error);
    return res.status(500).json({ success: false, message: "An error occurred while sending your message. Please try again later." });
  }
};

const getArticle = async (req, res, next) => {
  try {
    const articleId = req.params.id;
    const userId = req.session?.user?._id || req.session?.user?.id;
    const cartCount = await getCartCountService(userId);
    const wishlistCount = await getWishlistCountService(userId);

    const articles = {
      '1': {
        title: "Reading books always makes the moments happy",
        date: "Mar 30, 2021",
        image: "/images/post-img1.jpg",
        content: `
          <p>Books are uniquely portable magic. When you open a book, you're opening a new world of possibilities, emotions, and discoveries. Whether it's a thrilling mystery, an insightful biography, or a sweeping fantasy, reading is a timeless source of joy and relaxation.</p>
          <p>Scientific studies have shown that reading not only improves focus and memory but also significantly reduces stress. In our fast-paced, digital world, taking a moment to sit down with a physical book is one of the most effective ways to unplug and reconnect with yourself.</p>
          <p>Make it a habit to set aside at least 20 minutes a day to read. You'll quickly find that those quiet moments become the highlight of your day, bringing a sense of calm and happiness that lingers long after you've closed the cover.</p>
        `
      },
      '2': {
        title: "Reading books always makes the moments happy",
        date: "Mar 29, 2021",
        image: "/images/post-img2.jpg",
        content: `
          <p>There is a profound connection between reading and well-being. Getting lost in a good story allows your mind to take a break from the anxieties of daily life. It’s a form of escapism that simultaneously enriches your perspective.</p>
          <p>Many successful people attribute their achievements to a voracious reading habit. By reading, you are essentially downloading decades of someone else's life experience and wisdom into your brain in a matter of hours.</p>
          <p>From developing empathy to expanding your vocabulary, the benefits are endless. So brew a cup of tea, find a comfortable nook, and let a good book make your moment truly happy.</p>
        `
      },
      '3': {
        title: "Reading books always makes the moments happy",
        date: "Feb 27, 2021",
        image: "/images/post-img3.jpg",
        content: `
          <p>Every book is a new journey. It’s an opportunity to step into someone else’s shoes and see the world through their eyes. This shared human experience is what makes literature so incredibly powerful.</p>
          <p>In modern times, it's easy to be overwhelmed by the constant ping of notifications and the endless scroll of social media. A book demands your full attention, training your brain to focus on one task deeply—a rare skill today.</p>
          <p>Ultimately, reading is an act of self-care. It's a promise to yourself that you value your own mind enough to feed it high-quality, thought-provoking ideas. Keep reading, and keep making those moments happy.</p>
        `
      }
    };

    const article = articles[articleId];

    if (!article) {
      return res.redirect('/');
    }

    return res.render("user/article", {
      user: req.session?.user,
      cartCount,
      wishlistCount,
      article
    });
  } catch (error) {
    console.error("GET ARTICLE ERROR:", error);
    next(error);
  }
};

export default {
  getuserIndex,
  getHome,
  getProductDetails,
  getHelpCenter,
  getContactUs,
  postContactUs,
  getArticle
};