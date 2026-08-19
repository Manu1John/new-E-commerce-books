import Coupon from "../../models/Coupon.js";

const couponControler = {
  // 1. List Coupons with Search and Pagination
  getCoupons: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 5; // Items per page
      const skip = (page - 1) * limit;
      const searchQuery = req.query.search || "";

      // Base filter: only show non-deleted coupons
      const filter = { isDeleted: { $ne: true } };

      // Multiple Search (by Code or Type)
      if (searchQuery) {
        filter.$or = [{ code: { $regex: searchQuery, $options: "i" } }];
        const lowerSearch = searchQuery.toLowerCase().trim();
        if (["percentage", "flat"].includes(lowerSearch)) {
          filter.$or.push({ discountType: lowerSearch });
        }
      }

      const totalCoupons = await Coupon.countDocuments(filter);
      const totalPages = Math.ceil(totalCoupons / limit);

      const coupons = await Coupon.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.render("admin/coupons", { 
        coupons, 
        title: "Coupon Management",
        jsFile:"coupon.js",
        cssFile:"coupon.css",
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
      jsFile:"addCoupons.js",
      cssFile:"addCoupons.css",
      title: "Add Coupon"
     });
  },

  // 3. Handle Add Submission (Fetch API)
  createCoupon: async (req, res) => {
    try {
      const { code, discountType, discountValue, minPurchaseAmount, startDate, expiryDate, description, isActive } = req.body;
      
      // Duplicate Code Check
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase(), isDeleted: { $ne: true } });
      if (existingCoupon) {
        return res.status(400).json({ success: false, message: "A coupon with this code already exists." });
      }

      // Dynamic Usage Limit Calculation
      const start = new Date(startDate);
      const end = new Date(expiryDate);
      let calculatedLimit = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (calculatedLimit <= 0) calculatedLimit = 1; // Minimum 1 usage if start and expiry are the same day

      const newCoupon = new Coupon({
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minPurchaseAmount,
        startDate,
        expiryDate,
        usageLimit: calculatedLimit, 
        description,
        isActive: isActive === "true"
      });
      
      await newCoupon.save();
      return res.status(200).json({ success: true, message: "Coupon created successfully!" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error while creating coupon." });
    }
  },

  // 4. Render Edit Form
  getEditCoupon: async (req, res) => {
    try {
      const coupon = await Coupon.findById(req.params.id);
      if (!coupon || coupon.isDeleted) return res.redirect("/admin/coupons");
      
      res.render("admin/editCoupons", { 
        title: "Edit Coupon",
        // FIXED: Point to the correct Edit JS and CSS files
        jsFile: "editCoupons.js",
        cssFile: "editCoupons.css",
        coupon
      });
    } catch (error) {
      res.redirect("/admin/coupons");
    }
  },

  // 5. Handle Edit Submission (Fetch API)
  updateCoupon: async (req, res) => {
    try {
      const { id } = req.params;
      const { code, discountType, discountValue, minPurchaseAmount, startDate, expiryDate, description, isActive } = req.body;

      // Duplicate check (excluding current coupon)
      const existingCoupon = await Coupon.findOne({ _id: { $ne: id }, code: code.toUpperCase(), isDeleted: { $ne: true } });
      if (existingCoupon) {
        return res.status(400).json({ success: false, message: "A coupon with this code already exists." });
      }

      // Dynamic Usage Limit Calculation
      const start = new Date(startDate);
      const end = new Date(expiryDate);
      let calculatedLimit = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (calculatedLimit <= 0) calculatedLimit = 1;

      await Coupon.findByIdAndUpdate(id, {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minPurchaseAmount,
        startDate,
        expiryDate,
        usageLimit: calculatedLimit, 
        description,
        isActive: isActive === "true"
      });

      return res.status(200).json({ success: true, message: "Coupon updated successfully!" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error while updating coupon." });
    }
  },

  // 6. Handle Soft Delete
  deleteCoupon: async (req, res) => {
    try {
      const { id } = req.params;
      await Coupon.findByIdAndUpdate(id, { isDeleted: true }); // Soft Delete
      res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
};

export default couponControler;