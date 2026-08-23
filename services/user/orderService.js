import Order from "../../models/Order.js";
import Product from "../../models/products.js";
import Wallet from "../../models/Wallet.js";
import User from "../../models/User.js";
import PDFDocument from "pdfkit";
import { getOrderMoneySummary, roundMoney } from "./pricingService.js";

const CANCELLABLE_STATUSES = ["Ordered", "Pending", "Confirmed", "Processing", "Packed"];
const INACTIVE_STATUSES = ["Cancelled", "Returned", "Refunded"];

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
    canCancel: CANCELLABLE_STATUSES.includes(status)
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
  const isPaid = ["Paid", "Refunded"].includes(order.paymentStatus) || ["Wallet", "Wallet+Online"].includes(order.paymentMethod);
  if (!isPaid || item.refundedAmount > 0) return 0;

  const refundAmount = roundMoney((item.finalPrice || item.price || 0) * item.quantity);
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

  await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
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

  const cancellableItems = order.items.filter((item) => CANCELLABLE_STATUSES.includes(item.status || order.status));
  if (!cancellableItems.length) throw new Error(`Order cannot be cancelled because it is currently ${order.status}`);

  for (const item of cancellableItems) {
    item.status = "Cancelled";
    item.cancellationReason = cancellationReason || "Cancelled by user";
    item.cancelledAt = new Date();
    await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    await refundOrderItemIfNeeded(order, item);
  }

  order.status = order.items.every((item) => (item.status || order.status) === "Cancelled") ? "Cancelled" : "Processing";
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
    item.status = "Returned";
    await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
  }

  await order.save();
  return prepareOrderForView(order);
};

export const generateInvoicePDF = (order, res) => {
  const orderData = prepareOrderForView(order);
  const doc = new PDFDocument({ margin: 45 });
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${orderData.orderId}.pdf`);
  
  doc.pipe(res);
  
  doc.fontSize(20).text("BookStore Invoice", { align: "center" }).moveDown(0.5);
  doc.fontSize(10).text("BookStore", { align: "center" });
  doc.text("Premium Booksaw Book Store", { align: "center" }).moveDown();

  doc.fontSize(12).text(`Invoice / Order No: ${orderData.orderId}`);
  doc.text(`Order Date: ${new Date(orderData.createdAt).toLocaleString()}`);
  doc.text(`Payment Method: ${orderData.paymentMethod}`);
  doc.text(`Payment Status: ${orderData.paymentStatus}`).moveDown();
  
  doc.font("Helvetica-Bold").text("Customer / Shipping Details");
  doc.font("Helvetica");
  if (orderData.user) {
    doc.text(`${orderData.user.firstName || ""} ${orderData.user.lastName || ""}`.trim());
    if (orderData.user.email) doc.text(orderData.user.email);
  }
  if (orderData.shippingAddress) {
    doc.text(orderData.shippingAddress.fullName);
    doc.text(orderData.shippingAddress.addressLine);
    if (orderData.shippingAddress.landmark) doc.text(`Landmark: ${orderData.shippingAddress.landmark}`);
    doc.text(`${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} - ${orderData.shippingAddress.pincode}`);
    doc.text(`Phone: ${orderData.shippingAddress.phone}`).moveDown();
  }
  
  const startY = doc.y;
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("Product", 45, startY, { width: 170 });
  doc.text("Qty", 220, startY, { width: 35 });
  doc.text("MRP", 260, startY, { width: 55 });
  doc.text("Discount", 320, startY, { width: 70 });
  doc.text("Final", 395, startY, { width: 60 });
  doc.text("Subtotal", 465, startY, { width: 75 });
  doc.moveTo(45, startY + 16).lineTo(550, startY + 16).stroke();

  let y = startY + 25;
  doc.font("Helvetica").fontSize(9);
  orderData.items.forEach((item) => {
    if (y > 700) {
      doc.addPage();
      y = 45;
    }
    doc.text(item.product?.title || "Unknown Product", 45, y, { width: 170 });
    doc.text(String(item.quantity), 220, y, { width: 35 });
    doc.text(`Rs.${item.originalPrice.toFixed(2)}`, 260, y, { width: 55 });
    doc.text(`${item.discountPercentage}% / Rs.${(item.discountAmount * item.quantity).toFixed(2)}`, 320, y, { width: 70 });
    doc.text(`Rs.${item.finalPrice.toFixed(2)}`, 395, y, { width: 60 });
    doc.text(`Rs.${item.subtotal.toFixed(2)}`, 465, y, { width: 75 });
    y += 32;
  });
  
  y += 10;
  doc.moveTo(45, y).lineTo(550, y).stroke();
  y += 15;

  const summary = orderData.money;
  doc.font("Helvetica").text(`Subtotal: Rs.${summary.subtotal.toFixed(2)}`, 370, y);
  doc.text(`Total Discount: -Rs.${summary.totalDiscount.toFixed(2)}`, 370, y + 16);
  doc.text(`Shipping: Rs.${summary.shippingCharge.toFixed(2)}`, 370, y + 32);
  doc.font("Helvetica-Bold").text(`Final Amount: Rs.${summary.finalTotal.toFixed(2)}`, 370, y + 52);
  doc.end();
};
