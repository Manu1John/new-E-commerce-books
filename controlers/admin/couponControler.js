// Adjust the path based on your directory structure
import couponService from "../../services/admin/couponService.js";

const couponController = {
  
  // 1. List Coupons with Search and Pagination
  getCoupons: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 5; 
      const searchQuery = req.query.search || "";

      const { coupons, totalPages } = await couponService.getCouponsList(searchQuery, page, limit);

      res.render("admin/coupons", { 
        coupons, 
        title: "Coupon Management",
        jsFile: "coupon.js",
        cssFile: "coupon.css",
        search: searchQuery,
        currentPage: page,
        totalPages
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  },

  // 2. Render Add Form
  getAddCoupon: (req, res) => {
    res.render("admin/addCoupons", { 
      jsFile: "addCoupons.js",
      cssFile: "addCoupons.css",
      title: "Add Coupon"
    });
  },

  // 3. Handle Add Submission (Fetch API)
  createCoupon: async (req, res) => {
    try {
      const result = await couponService.createCoupon(req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
      
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error while creating coupon." });
    }
  },

  // 4. Render Edit Form
  getEditCoupon: async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await couponService.getCouponById(id);
      
      if (!coupon || coupon.isDeleted) {
        return res.redirect("/admin/coupons");
      }
      
      res.render("admin/editCoupons", { 
        title: "Edit Coupon",
        jsFile: "editCoupons.js",
        cssFile: "editCoupons.css",
        coupon
      });
    } catch (error) {
      console.error(error);
      res.redirect("/admin/coupons");
    }
  },

  // 5. Handle Edit Submission (Fetch API)
  updateCoupon: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await couponService.updateCoupon(id, req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
      
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error while updating coupon." });
    }
  },

  // 6. Handle Soft Delete
  deleteCoupon: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await couponService.deleteCoupon(id);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
};

export default couponController;