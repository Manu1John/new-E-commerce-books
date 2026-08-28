import Order from "../../models/Order.js";
import Product from "../../models/products.js";
import Wallet from "../../models/Wallet.js";
import User from "../../models/User.js";
import PDFDocument from "pdfkit";
import { getOrderMoneySummary, roundMoney } from "./pricingService.js";

const CANCELLABLE_STATUSES = ["Ordered", "Pending", "Confirmed", "Processing", "Packed"];
const INACTIVE_STATUSES = ["Cancelled", "Returned", "Partially Returned", "Refunded"];

export const normalizeOrderItem = (item, orderStatus = "Pending") => {
  const itemObject = item.toObject ? item.toObject() : { ...item };
  const originalPrice = roundMoney(itemObject.originalPrice || itemObject.product?.price || itemObject.price || 0);
  const finalPrice = roundMoney(itemObject.finalPrice || itemObject.price || originalPrice);
  const discountAmount = roundMoney(itemObject.discountAmount || Math.max(0, originalPrice - finalPrice));
  const discountPercentage = itemObject.discountPercentage || (originalPrice ? roundMoney((discountAmount / originalPrice) * 100) : 0);
  const subtotal = roundMoney(itemObject.subtotal || finalPrice * itemObject.quantity);
  const status = itemObject.status || (INACTIVE_STATUSES.includes(orderStatus) ? orderStatus : orderStatus === "Pending" ? "Ordered" : orderStatus);

  return {
    ...itemObject,
    originalPrice,
    finalPrice,
    price: finalPrice,
    discountAmount,
    discountPercentage,
    subtotal,
    status,
    canCancel: CANCELLABLE_STATUSES.includes(status),
    canReturn: status === "Delivered"
  };
};

export const deriveOrderStatus = (items = [], fallbackStatus = "Pending") => {
  if (!items.length) return fallbackStatus;
  const statuses = items.map((item) => item.status || fallbackStatus);
  if (statuses.every((status) => status === "Cancelled")) return "Cancelled";
  if (statuses.every((status) => status === "Returned")) return "Returned";
  if (statuses.every((status) => status === "Refunded")) return "Refunded";
  if (statuses.some((status) => INACTIVE_STATUSES.includes(status)) && statuses.some((status) => !INACTIVE_STATUSES.includes(status))) {
    return "Partially Cancelled";
  }
  if (statuses.every((status) => status === "Delivered")) return "Delivered";

  const progression = ["Ordered", "Pending", "Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"];
  return statuses.reduce((lowest, status) => {
    const currentIndex = progression.indexOf(status);
    const lowestIndex = progression.indexOf(lowest);
    if (currentIndex === -1) return lowest;
    if (lowestIndex === -1) return status;
    return currentIndex < lowestIndex ? status : lowest;
  }, fallbackStatus);
};

export const prepareOrderForView = (order) => {
  if (!order) return null;
  const orderObject = order.toObject ? order.toObject() : { ...order };
  orderObject.items = (orderObject.items || []).map((item) => normalizeOrderItem(item, orderObject.status));
  orderObject.displayStatus = deriveOrderStatus(orderObject.items, orderObject.status);
  orderObject.money = getOrderMoneySummary(orderObject);
  return orderObject;
};

export const getUserOrdersService = async (userId, page, limit, search) => {
  const skip = (page - 1) * limit;
  const query = { user: userId };
  const searchValue = search?.trim();
  if (searchValue) {
    query.orderId = { $regex: searchValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }

  const orderDocs = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("items.product");

  const orders = orderDocs.map(prepareOrderForView);
  const total = await Order.countDocuments(query);
  return { orders, total, totalPages: Math.ceil(total / limit) || 1 };
};

export const getOrderDetailsService = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId })
    .populate("user", "firstName lastName email phone")
    .populate("items.product")
    .populate("shippingAddress");
  return prepareOrderForView(order);
};

export const getOrderSuccessService = async (userId, orderId) => {
  return getOrderDetailsService(userId, orderId);
};

const ensureWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0, transactions: [] });
    await User.findByIdAndUpdate(userId, { wallet: wallet._id });
  }
  return wallet;
};

const refundOrderItemIfNeeded = async (order, item) => {
  const isPaid = ["Paid", "Refunded"].includes(order.paymentStatus);
  if (!isPaid || item.refundedAmount > 0) return 0;

  const itemTotal = (item.finalPrice || item.price || 0) * item.quantity;
  const orderItemsTotal = order.items.reduce((sum, it) => sum + ((it.finalPrice || it.price || 0) * it.quantity), 0);
  
  let proportionalCouponDiscount = 0;
  if (order.couponDiscount > 0 && orderItemsTotal > 0) {
    proportionalCouponDiscount = (itemTotal / orderItemsTotal) * order.couponDiscount;
  }
  
  const refundAmount = roundMoney(Math.max(0, itemTotal - proportionalCouponDiscount));
  if (refundAmount <= 0) return 0;

  const wallet = await ensureWallet(order.user);
  wallet.balance += refundAmount;
  wallet.transactions.push({
    type: "credit",
    amount: refundAmount,
    description: `Refund for cancelled item in Order ${order.orderId || order._id}`
  });
  await wallet.save();

  item.refundedAmount = refundAmount;
  return refundAmount;
};

export const cancelOrderItemService = async (userId, orderId, itemId, cancellationReason = "") => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new Error("Order not found");

  const item = order.items.id(itemId);
  if (!item) throw new Error("Order item not found");

  const itemStatus = item.status || order.status || "Pending";
  if (!CANCELLABLE_STATUSES.includes(itemStatus)) {
    throw new Error(`This item cannot be cancelled because it is currently ${itemStatus}`);
  }

  item.status = "Cancelled";
  item.cancellationReason = cancellationReason || "Cancelled by user";
  item.cancelledAt = new Date();

  const wasStockDeducted = order.paymentMethod === "COD" || ["Paid", "Refunded"].includes(order.paymentStatus);
  if (wasStockDeducted) {
    await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
  }
  const refundAmount = await refundOrderItemIfNeeded(order, item);

  const cancelledFinal = roundMoney((item.finalPrice || item.price || 0) * item.quantity);
  const cancelledOriginal = roundMoney((item.originalPrice || item.price || 0) * item.quantity);
  const cancelledOfferDiscount = roundMoney((item.discountAmount || 0) * item.quantity);

  order.finalAmount = roundMoney(Math.max(0, order.finalAmount - cancelledFinal));
  order.totalAmount = roundMoney(Math.max(0, order.totalAmount - cancelledOriginal));
  order.offerDiscount = roundMoney(Math.max(0, (order.offerDiscount || 0) - cancelledOfferDiscount));
  order.status = order.items.every((orderItem) => (orderItem.status || order.status) === "Cancelled") ? "Cancelled" : "Processing";

  if (order.items.every((orderItem) => ["Cancelled", "Refunded"].includes(orderItem.status || "")) && order.paymentStatus === "Paid") {
    order.paymentStatus = "Refunded";
  }

  if (order.status === "Cancelled" && order.couponApplied) {
    const Coupon = (await import("../../models/Coupon.js")).default;
    await Coupon.findByIdAndUpdate(order.couponApplied, { $pull: { usedBy: userId } });
  }

  await order.save();
  const populatedOrder = await Order.findById(order._id)
    .populate("user", "firstName lastName email phone")
    .populate("items.product")
    .populate("shippingAddress");

  return {
    order: prepareOrderForView(populatedOrder),
    itemId,
    itemStatus: "Cancelled",
    refundAmount
  };
};

export const cancelOrderService = async (userId, orderId, cancellationReason) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new Error("Order not found");

  // Always filter using each item's own status, not the parent order status
  // This allows cancellation of remaining items even on Partially Returned orders
  const cancellableItems = order.items.filter((item) => {
    const effectiveStatus = item.status || order.status;
    return CANCELLABLE_STATUSES.includes(effectiveStatus);
  });

  if (!cancellableItems.length) {
    throw new Error(`Order cannot be cancelled because it is currently ${order.status}`);
  }

  for (const item of cancellableItems) {
    item.status = "Cancelled";
    item.cancellationReason = cancellationReason || "Cancelled by user";
    item.cancelledAt = new Date();
    const wasStockDeducted = order.paymentMethod === "COD" || ["Paid", "Refunded"].includes(order.paymentStatus);
    if (wasStockDeducted) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    }
    await refundOrderItemIfNeeded(order, item);
  }

  // Determine final order status based on all item statuses
  const allStatuses = order.items.map((item) => item.status || order.status);
  const allCancelled = allStatuses.every((s) => s === "Cancelled");
  const hasReturned = allStatuses.some((s) => s === "Returned");
  const hasCancelled = allStatuses.some((s) => s === "Cancelled");

  if (allCancelled) {
    order.status = "Cancelled";
    // Restore coupon if it was applied and everything is cancelled
    if (order.couponApplied) {
      const Coupon = (await import("../../models/Coupon.js")).default;
      await Coupon.findByIdAndUpdate(order.couponApplied, { $pull: { usedBy: userId } });
    }
  } else if (hasReturned && hasCancelled) {
    // Mixed: some returned, some cancelled — treat entire order as Cancelled
    order.status = "Cancelled";
  } else {
    order.status = "Processing";
  }

  order.cancellationReason = cancellationReason;
  await order.save();
  return prepareOrderForView(order);
};

export const returnOrderService = async (userId, orderId, returnReason) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new Error("Order not found");
  if (order.status !== "Delivered") throw new Error("Only delivered orders can be returned");

  order.status = "Returned";
  order.returnReason = returnReason;

  for (let item of order.items) {
    if (item.status === "Delivered") {
      item.status = "Returned";
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
      await refundOrderItemIfNeeded(order, item);
    }
  }

  await order.save();
  return prepareOrderForView(order);
};

export const returnOrderItemService = async (userId, orderId, itemId, returnReason) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new Error("Order not found");

  const item = order.items.id(itemId);
  if (!item) throw new Error("Order item not found");

  if (item.status !== "Delivered") {
    throw new Error(`This item cannot be returned because it is currently ${item.status}`);
  }

  item.status = "Returned";
  item.returnReason = returnReason || "Returned by user";

  await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
  const refundAmount = await refundOrderItemIfNeeded(order, item);

  const returnedFinal = roundMoney((item.finalPrice || item.price || 0) * item.quantity);
  const returnedOriginal = roundMoney((item.originalPrice || item.price || 0) * item.quantity);
  const returnedOfferDiscount = roundMoney((item.discountAmount || 0) * item.quantity);

  order.finalAmount = roundMoney(Math.max(0, order.finalAmount - returnedFinal));
  order.totalAmount = roundMoney(Math.max(0, order.totalAmount - returnedOriginal));
  order.offerDiscount = roundMoney(Math.max(0, (order.offerDiscount || 0) - returnedOfferDiscount));
  order.status = order.items.every((orderItem) => ["Returned", "Cancelled", "Refunded"].includes(orderItem.status)) ? "Returned" : "Partially Returned";

  await order.save();
  const populatedOrder = await Order.findById(order._id)
    .populate("user", "firstName lastName email phone")
    .populate("items.product")
    .populate("shippingAddress");

  return {
    order: prepareOrderForView(populatedOrder),
    itemId,
    itemStatus: "Returned",
    refundAmount
  };
};

export const getTrackOrderItemService = async (userId, orderId, itemId) => {
  const order = await Order.findOne({ _id: orderId, user: userId })
    .populate("items.product")
    .populate("shippingAddress");
    
  if (!order) throw new Error("Order not found");
  
  const item = order.items.id(itemId);
  if (!item) throw new Error("Order item not found");
  
  // ensure we have default status history if none exists
  if (!item.statusHistory || item.statusHistory.length === 0) {
     item.statusHistory = [
       { status: "Ordered", date: order.createdAt, notes: "Order placed successfully" }
     ];
     // if it's already beyond ordered, let's add its current status
     if (item.status && item.status !== "Ordered") {
       item.statusHistory.push({
         status: item.status,
         date: order.updatedAt,
         notes: "Status updated"
       });
     }
  }

  return {
    order: prepareOrderForView(order),
    item: normalizeOrderItem(item, order.status)
  };
};

export const generateInvoicePDF = (order, res) => {
  const orderData = prepareOrderForView(order);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${orderData.orderId}.pdf`);
  
  doc.pipe(res);
  
  // Header section
  doc.fontSize(22).font("Helvetica-Bold").text("INVOICE", { align: "right" });
  doc.fontSize(10).font("Helvetica-Bold").text("BookStore", 50, 50);
  doc.font("Helvetica").text("Premium Booksaw Book Store", 50, 65);
  doc.moveDown(2);

  // Invoice Details
  const detailsY = doc.y;
  doc.fontSize(10).font("Helvetica-Bold").text("Invoice To:", 50, detailsY);
  doc.font("Helvetica");
  if (orderData.user) {
    doc.text(`${orderData.user.firstName || ""} ${orderData.user.lastName || ""}`.trim(), 50, detailsY + 15);
    if (orderData.user.email) doc.text(orderData.user.email, 50, detailsY + 30);
  }
  if (orderData.shippingAddress) {
    doc.text(orderData.shippingAddress.addressLine, 50, detailsY + 45);
    doc.text(`${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} - ${orderData.shippingAddress.pincode}`, 50, detailsY + 60);
    doc.text(`Phone: ${orderData.shippingAddress.phone}`, 50, detailsY + 75);
  }

  // Invoice Metadata
  doc.font("Helvetica-Bold").text(`Invoice No:`, 350, detailsY);
  doc.font("Helvetica").text(`#${orderData.orderId}`, 450, detailsY);
  doc.font("Helvetica-Bold").text(`Order Date:`, 350, detailsY + 15);
  doc.font("Helvetica").text(new Date(orderData.createdAt).toLocaleDateString(), 450, detailsY + 15);
  doc.font("Helvetica-Bold").text(`Payment Method:`, 350, detailsY + 30);
  doc.font("Helvetica").text(orderData.paymentMethod || "N/A", 450, detailsY + 30);
  doc.font("Helvetica-Bold").text(`Payment Status:`, 350, detailsY + 45);
  doc.font("Helvetica").text(orderData.paymentStatus || "N/A", 450, detailsY + 45);
  
  doc.moveDown(3);
  const startY = doc.y;

  // Table Header
  doc.rect(50, startY, 500, 20).fill("#f3f4f6");
  doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9);
  doc.text("Item Description", 60, startY + 6, { width: 170 });
  doc.text("Qty", 240, startY + 6, { width: 35 });
  doc.text("MRP", 280, startY + 6, { width: 60 });
  doc.text("Discount", 350, startY + 6, { width: 70 });
  doc.text("Final", 430, startY + 6, { width: 50 });
  doc.text("Total", 480, startY + 6, { width: 60, align: "right" });

  let y = startY + 30;
  doc.font("Helvetica").fontSize(9);
  
  orderData.items.forEach((item) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
      doc.rect(50, y, 500, 20).fill("#f3f4f6");
      doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9);
      doc.text("Item Description", 60, y + 6, { width: 170 });
      doc.text("Qty", 240, y + 6, { width: 35 });
      doc.text("MRP", 280, y + 6, { width: 60 });
      doc.text("Discount", 350, y + 6, { width: 70 });
      doc.text("Final", 430, y + 6, { width: 50 });
      doc.text("Total", 480, y + 6, { width: 60, align: "right" });
      y += 30;
      doc.font("Helvetica").fontSize(9);
    }
    
    doc.text(item.product?.title || "Unknown Product", 60, y, { width: 170 });
    doc.text(String(item.quantity), 240, y, { width: 35 });
    doc.text(`₹${item.originalPrice.toFixed(2)}`, 280, y, { width: 60 });
    doc.text(`₹${(item.discountAmount * item.quantity).toFixed(2)} (${item.discountPercentage}%)`, 350, y, { width: 70 });
    doc.text(`₹${item.finalPrice.toFixed(2)}`, 430, y, { width: 50 });
    doc.text(`₹${item.subtotal.toFixed(2)}`, 480, y, { width: 60, align: "right" });
    
    y += 20;
    doc.moveTo(50, y).lineTo(550, y).strokeColor("#e5e7eb").stroke();
    y += 10;
    doc.fillColor("#000000");
  });
  
  y += 10;

  // Summary Section
  const summary = orderData.money;
  doc.font("Helvetica").fontSize(10);
  
  const labelX = 350;
  const valueX = 450;
  const valWidth = 90;

  doc.text("Subtotal:", labelX, y);
  doc.text(`₹${summary.subtotal.toFixed(2)}`, valueX, y, { width: valWidth, align: "right" });
  
  doc.text("Total Discount:", labelX, y + 20);
  doc.text(`-₹${summary.totalDiscount.toFixed(2)}`, valueX, y + 20, { width: valWidth, align: "right" });
  
  doc.text("Tax Amount (5%):", labelX, y + 40);
  doc.text(`₹${summary.tax.toFixed(2)}`, valueX, y + 40, { width: valWidth, align: "right" });
  
  doc.text("Shipping Charge:", labelX, y + 60);
  doc.text(`₹${summary.shippingCharge.toFixed(2)}`, valueX, y + 60, { width: valWidth, align: "right" });
  
  doc.moveTo(350, y + 80).lineTo(550, y + 80).strokeColor("#000000").stroke();
  
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Final Total:", labelX, y + 90);
  doc.text(`₹${summary.finalTotal.toFixed(2)}`, valueX, y + 90, { width: valWidth, align: "right" });

  // Footer Message
  doc.font("Helvetica").fontSize(10).text("Thank you for shopping with BookStore!", 50, 750, { align: "center" });

  doc.end();
};
