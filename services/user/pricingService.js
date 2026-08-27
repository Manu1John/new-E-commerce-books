import Offer from "../../models/Offer.js";

export const roundMoney = (value = 0) => Math.max(0, Math.round((Number(value) || 0) * 100) / 100);

const getProductCategoryId = (product) => {
  const category = product?.category;
  if (!category) return null;
  return category._id || category;
};

export const getBestDiscountPercentage = async (product) => {
  if (!product) return 0;

  const categoryId = getProductCategoryId(product);
  const now = new Date();
  const offerFilter = {
    isActive: true,
    isDeleted: false,
    startDate: { $lte: now },
    expiryDate: { $gt: now },
    $or: [{ type: "product", productRef: product._id }]
  };

  if (categoryId) {
    offerFilter.$or.push({ type: "category", categoryRef: categoryId });
  }

  const offers = await Offer.find(offerFilter).select("discountPercentage").lean();
  if (!offers.length) return 0;

  return Math.max(...offers.map((offer) => Number(offer.discountPercentage) || 0));
};

export const calculateProductPricing = async (product) => {
  const originalPrice = roundMoney(product?.price || 0);
  const discountPercentage = await getBestDiscountPercentage(product);
  const discountAmount = roundMoney((originalPrice * discountPercentage) / 100);
  const finalPrice = roundMoney(originalPrice - discountAmount);

  return {
    originalPrice,
    discountPercentage,
    discountAmount,
    finalPrice
  };
};

export const attachPricingToProduct = async (product) => {
  if (!product) return product;
  const productObject = product.toObject ? product.toObject() : { ...product };
  productObject.pricing = await calculateProductPricing(productObject);
  return productObject;
};

export const attachPricingToProducts = async (products = []) => {
  return Promise.all(products.map((product) => attachPricingToProduct(product)));
};

export const getItemPricing = async (product, quantity = 1) => {
  const pricing = await calculateProductPricing(product);
  const qty = Number(quantity) || 0;

  return {
    ...pricing,
    quantity: qty,
    originalSubtotal: roundMoney(pricing.originalPrice * qty),
    discountSubtotal: roundMoney(pricing.discountAmount * qty),
    subtotal: roundMoney(pricing.finalPrice * qty)
  };
};

export const getOrderMoneySummary = (order) => {
  const items = order?.items || [];
  const subtotal = roundMoney(
    items.reduce((sum, item) => {
      const originalPrice = item.originalPrice ?? item.product?.price ?? item.price ?? 0;
      return sum + originalPrice * (item.quantity || 0);
    }, 0)
  );
  const itemDiscount = roundMoney(
    items.reduce((sum, item) => {
      const discountAmount = item.discountAmount ?? Math.max(0, (item.originalPrice ?? item.price ?? 0) - (item.finalPrice ?? item.price ?? 0));
      return sum + discountAmount * (item.quantity || 0);
    }, 0)
  );
  const couponDiscount = roundMoney(order?.couponDiscount || 0);
  const offerDiscount = roundMoney(order?.offerDiscount || itemDiscount);
  const totalDiscount = roundMoney(offerDiscount + couponDiscount);
  const shippingCharge = roundMoney(order?.shippingFee || 0);
  const amountBeforeTax = Math.max(0, subtotal - totalDiscount);
  const tax = roundMoney(order?.tax ?? (amountBeforeTax * 0.05));
  const finalTotal = roundMoney(order?.finalAmount ?? Math.max(0, amountBeforeTax + tax + shippingCharge));

  return {
    subtotal,
    itemDiscount,
    offerDiscount,
    couponDiscount,
    totalDiscount,
    shippingCharge,
    tax,
    finalTotal
  };
};
