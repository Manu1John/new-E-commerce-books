import Offer from "../../models/Offer.js";
import Product from "../../models/products.js";
import Category from "../../models/category.js";

const offerService = {
  // Fetch paginated offers and required related data
  async getOffersList(searchQuery, page = 1, limit = 5) {
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

    const totalOffers = await Offer.countDocuments(filter);
    const totalPages = Math.ceil(totalOffers / limit);

    const offers = await Offer.find(filter)
      .populate("productRef")
      .populate("categoryRef")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const products = await Product.find({ isDeleted: false, status: "active" });
    const categories = await Category.find({ isDeleted: false, status: "active" });

    return { offers, products, categories, totalPages };
  },

  // Helper to fetch active products and categories for forms
  async getActiveProductsAndCategories() {
    const products = await Product.find({ isDeleted: false, status: "active" });
    const categories = await Category.find({ isDeleted: false, status: "active" });
    return { products, categories };
  },

  // Create a new offer with business logic checks
  async createOffer(data) {
    const { name, type, discountPercentage, productRef, categoryRef, startDate, expiryDate, isActive } = data;
    
    // Duplicate Check 1: Offer Name
    const existingName = await Offer.findOne({ name: { $regex: `^${name}$`, $options: 'i' }, isDeleted: { $ne: true } });
    if (existingName) {
        return { success: false, message: "An offer with this name already exists." };
    }

    // Duplicate Check 2: Same Product/Category already has an active offer
    const duplicateQuery = { type, isDeleted: { $ne: true }, isActive: true };
    if (type === 'product') duplicateQuery.productRef = productRef;
    if (type === 'category') duplicateQuery.categoryRef = categoryRef;
    
    const existingOfferOnItem = await Offer.findOne(duplicateQuery);
    if (existingOfferOnItem) {
        return { success: false, message: "An active offer already exists for this specific item." };
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
    return { success: true, message: "Offer created successfully!" };
  },

  // Fetch a single offer by ID
  async getOfferById(id) {
    return await Offer.findById(id);
  },

  // Update an existing offer
  async updateOffer(id, data) {
    const { name, type, discountPercentage, productRef, categoryRef, startDate, expiryDate, isActive } = data;
    
    // Duplicate Name Check (excluding current offer)
    const existingName = await Offer.findOne({ _id: { $ne: id }, name: { $regex: `^${name}$`, $options: 'i' }, isDeleted: { $ne: true } });
    if (existingName) {
        return { success: false, message: "An offer with this name already exists." };
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
    return { success: true, message: "Offer updated successfully!" };
  },

  // Soft delete an offer
  async deleteOffer(id) {
    await Offer.findByIdAndUpdate(id, { isDeleted: true }); 
    return { success: true, message: "Offer deleted successfully" };
  }
};

export default offerService;