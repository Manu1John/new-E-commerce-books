import Offer from "../../models/Offer.js";
import Product from "../../models/products.js";
import Category from "../../models/category.js";

const offerControler = {
  
 // 1. List all offers (Dashboard View with Pagination & Search)
  getOffers: async (req, res) => {
    try {
      const searchQuery = req.query.search || "";
      
      // --- Pagination Setup ---
      const page = parseInt(req.query.page) || 1; // Default to page 1
      const limit = 5; // Number of offers per page (adjust as needed)
      const skip = (page - 1) * limit;

      const filter = { isDeleted: { $ne: true } };
      
      if (searchQuery) {
        filter.$or = [
          { name: { $regex: searchQuery, $options: "i" } }
        ];

        const lowerQuery = searchQuery.toLowerCase().trim();
        if (["product", "category", "referral"].includes(lowerQuery)) {
          filter.$or.push({ type: lowerQuery });
        }
      }

      // Count total matching documents to calculate total pages
      const totalOffers = await Offer.countDocuments(filter);
      const totalPages = Math.ceil(totalOffers / limit);

      // Fetch the limited/skipped offers for the current page
      const offers = await Offer.find(filter)
        .populate("productRef")
        .populate("categoryRef")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const products = await Product.find({ isDeleted: false, status: "active" });
      const categories = await Category.find({ isDeleted: false, status: "active" });
      
      res.render("admin/offers", { 
        title: "Offer Management",
        cssFile: "offers.css",
        jsFile: "offers.js",
        offers, 
        products,
        categories,
        search: searchQuery,
        currentPage: page,       // Pass current page to EJS
        totalPages: totalPages   // Pass total pages to EJS
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  },

  // 2. Render the Create Offer Form
  getCreateOffer: async (req, res) => {
    try {
      const products = await Product.find({ isDeleted: false, status: "active" });
      const categories = await Category.find({ isDeleted: false, status: "active" });
      
      res.render("admin/addOffer", {
        title: "Create Offer",
        cssFile: "addOffers.css",
        jsFile: "addOffers.js",
        bootstrap:true,
        products,
        categories
      });
    } catch (error) {
      console.error("Error loading create offer page:", error);
      res.redirect("/admin/offers");
    }
  },

  // 3. Handle Create Offer Submission (API via JSON)
  createOffer: async (req, res) => {
    try {
      const { name, type, discountPercentage, productRef, categoryRef, startDate, expiryDate, isActive } = req.body;
      
      // Duplicate Check 1: Offer Name
      const existingName = await Offer.findOne({ name: { $regex: `^${name}$`, $options: 'i' }, isDeleted: { $ne: true } });
      if (existingName) {
          return res.status(400).json({ success: false, message: "An offer with this name already exists." });
      }

      // Duplicate Check 2: Same Product/Category already has an active offer
      const duplicateQuery = { type, isDeleted: { $ne: true }, isActive: true };
      if (type === 'product') duplicateQuery.productRef = productRef;
      if (type === 'category') duplicateQuery.categoryRef = categoryRef;
      
      const existingOfferOnItem = await Offer.findOne(duplicateQuery);
      if (existingOfferOnItem) {
          return res.status(400).json({ success: false, message: "An active offer already exists for this specific item." });
      }

      const offerData = {
        name,
        type,
        discountPercentage,
        startDate,
        expiryDate,
        isActive: isActive === "true" || isActive === true,
        productRef: type === 'product' ? productRef : null,
        categoryRef: type === 'category' ? categoryRef : null,
      };

      await Offer.create(offerData);
      return res.status(200).json({ success: true, message: "Offer created successfully!" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  },

  // 4. Render the Edit Offer Form
  getEditOffer: async (req, res) => {
    try {
      const { id } = req.params;
      const offer = await Offer.findById(id);
      
      if (!offer || offer.isDeleted) {
        return res.redirect("/admin/offers");
      }

      const products = await Product.find({ isDeleted: false, status: "active" });
      const categories = await Category.find({ isDeleted: false, status: "active" });
      
      res.render("admin/editOffer", {
        title: "Edit Offer",
        cssFile: "addOffers.css",
        jsFile: "editOffers.js", 
        offer,
        products,
        categories
      });
    } catch (error) {
      console.error("Error loading edit offer page:", error);
      res.redirect("/admin/offers");
    }
  },

  // 5. Handle the Edit Offer Submission (API via JSON)
  postEditOffer: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, type, discountPercentage, productRef, categoryRef, startDate, expiryDate, isActive } = req.body;
      
      // Duplicate Name Check (excluding current offer)
      const existingName = await Offer.findOne({ _id: { $ne: id }, name: { $regex: `^${name}$`, $options: 'i' }, isDeleted: { $ne: true } });
      if (existingName) {
          return res.status(400).json({ success: false, message: "An offer with this name already exists." });
      }

      const updateData = {
        name,
        type,
        discountPercentage,
        startDate,
        expiryDate,
        isActive: isActive === "true" || isActive === true,
        productRef: type === 'product' ? productRef : null,
        categoryRef: type === 'category' ? categoryRef : null,
      };

      await Offer.findByIdAndUpdate(id, updateData, { runValidators: true });
      return res.status(200).json({ success: true, message: "Offer updated successfully!" });
    } catch (error) {
      console.error("Error updating offer:", error);
      return res.status(500).json({ success: false, message: "Server error while updating." });
    }
  },

  // 6. Handle Delete Offer (Soft Delete)
  deleteOffer: async (req, res) => {
    try {
      const { id } = req.params;
      // Implementing Soft Delete instead of findByIdAndDelete
      await Offer.findByIdAndUpdate(id, { isDeleted: true }); 
      res.json({ success: true, message: "Offer deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
};

export default offerControler;