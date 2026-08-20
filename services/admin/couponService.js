

import Coupon from "../../models/Coupon.js";

const couponService = {
  // Fetch paginated coupons and apply search filters
  async getCouponsList(searchQuery, page = 1, limit = 5) {
    const skip = (page - 1) * limit;
    const filter = { isDeleted: { $ne: true } };

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

    return { coupons, totalPages };
  },

  // Create a new coupon with duplication checks and limit calculations
  async createCoupon(data) {
    const { code, discountType, discountValue, minPurchaseAmount, startDate, expiryDate, description, isActive } = data;
    
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase(), isDeleted: { $ne: true } });
    if (existingCoupon) {
      return { success: false, message: "A coupon with this code already exists." };
    }

    const start = new Date(startDate);
    const end = new Date(expiryDate);
    let calculatedLimit = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (calculatedLimit <= 0) calculatedLimit = 1; 

    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minPurchaseAmount,
      startDate,
      expiryDate,
      usageLimit: calculatedLimit, 
      description,
      isActive: isActive === "true" || isActive === true
    });
    
    await newCoupon.save();
    return { success: true, message: "Coupon created successfully!" };
  },

  // Fetch a single coupon by ID
  async getCouponById(id) {
    return await Coupon.findById(id);
  },

  // Update an existing coupon
  async updateCoupon(id, data) {
    const { code, discountType, discountValue, minPurchaseAmount, startDate, expiryDate, description, isActive } = data;

    const existingCoupon = await Coupon.findOne({ _id: { $ne: id }, code: code.toUpperCase(), isDeleted: { $ne: true } });
    if (existingCoupon) {
      return { success: false, message: "A coupon with this code already exists." };
    }

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
      isActive: isActive === "true" || isActive === true
    });

    return { success: true, message: "Coupon updated successfully!" };
  },

  // Soft delete a coupon
  async deleteCoupon(id) {
    await Coupon.findByIdAndUpdate(id, { isDeleted: true }); 
    return { success: true, message: "Coupon deleted successfully" };
  }
};

export default couponService;