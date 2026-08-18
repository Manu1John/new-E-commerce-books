import Coupon from "../../models/Coupon.js";

const couponControler = {
  getCoupons: async (req, res) => {
    try {
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      res.render("admin/coupons", { coupons, title: "Coupon Management" });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  },

  createCoupon: async (req, res) => {
    try {
      const { code, discountType, discountValue, minPurchaseAmount, maxDiscountAmount, expiryDate } = req.body;
      
      const newCoupon = new Coupon({
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minPurchaseAmount,
        maxDiscountAmount,
        expiryDate
      });
      
      await newCoupon.save();
      req.flash("success", "Coupon created successfully");
      res.redirect("/admin/coupons");
    } catch (error) {
      console.error(error);
      req.flash("error", "Error creating coupon");
      res.redirect("/admin/coupons");
    }
  },

  deleteCoupon: async (req, res) => {
    try {
      const { id } = req.params;
      await Coupon.findByIdAndDelete(id);
      res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
};

export default couponControler;
