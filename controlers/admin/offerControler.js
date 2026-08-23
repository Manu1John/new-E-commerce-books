// Adjust the import path depending on your folder structure
import offerService from "../../services/admin/offerService.js"; 
 
const offerController = {
  
  // 1. List all offers (Dashboard View with Pagination & Search)
  getOffers: async (req, res) => {
    try {
      const searchQuery = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      const limit = 5; 

      const { offers, products, categories, totalPages } = await offerService.getOffersList(searchQuery, page, limit);

      res.render("admin/offers", { 
        title: "Offer Management",
        cssFile: "offers.css",
        jsFile: "offers.js",
        offers, 
        products,
        categories,
        search: searchQuery,
        currentPage: page,       
        totalPages: totalPages   
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  },

  // 2. Render the Create Offer Form
  getCreateOffer: async (req, res) => {
    try {
      const { products, categories } = await offerService.getActiveProductsAndCategories();
      
      res.render("admin/addOffer", {
        title: "Create Offer",
        cssFile: "addOffers.css",
        jsFile: "addOffers.js",
        bootstrap: true,
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
      const result = await offerService.createOffer(req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  },

  // 4. Render the Edit Offer Form
  getEditOffer: async (req, res) => {
    try {
      const { id } = req.params;
      const offer = await offerService.getOfferById(id);
      
      if (!offer || offer.isDeleted) {
        return res.redirect("/admin/offers");
      }

      const { products, categories } = await offerService.getActiveProductsAndCategories();
      
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
      const result = await offerService.updateOffer(id, req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
      
    } catch (error) {
      console.error("Error updating offer:", error);
      return res.status(500).json({ success: false, message: "Server error while updating." });
    }
  },

  // 6. Handle Delete Offer (Soft Delete)
  deleteOffer: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await offerService.deleteOffer(id);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
};

export default offerController;