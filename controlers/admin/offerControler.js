import Offer from "../../models/Offer.js";
import Product from "../../models/products.js";
import Category from "../../models/category.js";

const offerControler = {
  
  // 1. List all offers (Dashboard View)
  getOffers: async (req, res) => {
    try {
      const offers = await Offer.find().populate("productRef").populate("categoryRef").sort({ createdAt: -1 });
      const products = await Product.find({ isDeleted: false, status: "active" });
      const categories = await Category.find({ isDeleted: false, status: "active" });
      
      res.render("admin/offers", { 
        title: "Offer Management",
        cssFile: "offers.css",
        jsFile: "offers.js",
        offers, 
        products,
        categories
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

  // 3. Handle Create Offer Submission
  createOffer: async (req, res) => {
    try {
      const { name, type, discountPercentage, productRef, categoryRef, expiryDate } = req.body;
      
      const offerData = {
        name,
        type,
        discountPercentage,
        expiryDate,
        productRef: type === 'product' ? productRef : null,
        categoryRef: type === 'category' ? categoryRef : null,
      };

      await Offer.create(offerData);
      res.redirect("/admin/offers");
    } catch (error) {
      console.error(error);
      res.redirect("/admin/offers/add");
    }
  },

  // 4. Render the Edit Offer Form
  getEditOffer: async (req, res) => {
    try {
      const { id } = req.params;
      const offer = await Offer.findById(id);
      
      if (!offer) {
        req.flash("error", "Offer not found");
        return res.redirect("/admin/offers");
      }

      const products = await Product.find({ isDeleted: false, status: "active" });
      const categories = await Category.find({ isDeleted: false, status: "active" });
      
      res.render("admin/editOffer", {
        title: "Edit Offer",
        cssFile: "offers.css",
        jsFile: "offers.js",
        offer,
        products,
        categories
      });
    } catch (error) {
      console.error("Error loading edit offer page:", error);
     
      res.redirect("/admin/offers");
    }
  },

  // 5. Handle the Edit Offer Submission
  postEditOffer: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, type, discountPercentage, productRef, categoryRef, expiryDate, isActive } = req.body;
      
      const updateData = {
        name,
        type,
        discountPercentage,
        expiryDate,
        isActive: isActive === "true", // Convert string to boolean
        productRef: type === 'product' ? productRef : null,
        categoryRef: type === 'category' ? categoryRef : null,
      };

      // runValidators ensures the schema pre-save hooks and validations trigger
      await Offer.findByIdAndUpdate(id, updateData, { runValidators: true });
      
      res.redirect("/admin/offers");
    } catch (error) {
      console.error("Error updating offer:", error);
      res.redirect(`/admin/offers/edit/${req.params.id}`);
    }
  },

  // 6. Handle Delete Offer
  deleteOffer: async (req, res) => {
    try {
      const { id } = req.params;
      await Offer.findByIdAndDelete(id);
      res.json({ success: true, message: "Offer deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
};

export default offerControler;