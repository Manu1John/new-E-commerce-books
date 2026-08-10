import Order from "../../models/Order.js";
import Product from "../../models/products.js";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";

export const getUserOrdersService = async (userId, page, limit, search) => {
  const skip = (page - 1) * limit;
  let query = { user: userId };
  if (search) {
    query.orderId = { $regex: search, $options: "i" };
  }
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("items.product");

  const total = await Order.countDocuments(query);
  return { orders, total, totalPages: Math.ceil(total / limit) };
};

export const getOrderDetailsService = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId })
    .populate("items.product")
    .populate("shippingAddress");
  return order;
};

export const cancelOrderService = async (userId, orderId, cancellationReason) => {
  try {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw new Error("Order not found");
    if (order.status !== "Pending" && order.status !== "Shipped") {
      throw new Error("Order cannot be cancelled at this stage");
    }

    order.status = "Cancelled";
    order.cancellationReason = cancellationReason;

    // Restock
    for (let item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } }
      );
    }

    await order.save();
    return order;
  } catch (error) {
    throw error;
  }
};

export const returnOrderService = async (userId, orderId, returnReason) => {
  try {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw new Error("Order not found");
    if (order.status !== "Delivered") {
      throw new Error("Only delivered orders can be returned");
    }

    order.status = "Returned";
    order.returnReason = returnReason;

    // Restock
    for (let item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } }
      );
    }

    await order.save();
    return order;
  } catch (error) {
    throw error;
  }
};

export const generateInvoicePDF = (order, res) => {
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderId}.pdf`);
  
  doc.pipe(res);
  
  // Header
  doc.fontSize(20).text("Invoice", { align: "center" }).moveDown();
  
  // Order Info
  doc.fontSize(12).text(`Order ID: ${order.orderId}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
  doc.text(`Status: ${order.status}`).moveDown();
  
  // Shipping Address
  doc.text("Shipping Address:");
  if (order.shippingAddress) {
    doc.text(`${order.shippingAddress.fullName}`);
    doc.text(`${order.shippingAddress.addressLine}`);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`);
    doc.text(`Phone: ${order.shippingAddress.phone}`).moveDown();
  }
  
  // Items Table Header
  doc.text("Items:", { underline: true }).moveDown(0.5);
  
  let y = doc.y;
  doc.text("Product", 50, y);
  doc.text("Quantity", 300, y);
  doc.text("Price", 400, y);
  doc.text("Total", 480, y);
  
  doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
  y += 25;
  
  // Items
  order.items.forEach((item) => {
    doc.text(item.product?.title || "Unknown Product", 50, y, { width: 240 });
    doc.text(item.quantity.toString(), 300, y);
    doc.text(`$${item.price}`, 400, y);
    doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 480, y);
    y += 20;
  });
  
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 15;
  
  // Totals
  doc.text(`Subtotal: $${order.totalAmount.toFixed(2)}`, 400, y);
  y += 15;
  if (order.tax > 0) {
    doc.text(`Tax: $${order.tax.toFixed(2)}`, 400, y);
    y += 15;
  }
  if (order.shippingFee > 0) {
    doc.text(`Shipping: $${order.shippingFee.toFixed(2)}`, 400, y);
    y += 15;
  }
  if (order.discount > 0) {
    doc.text(`Discount: -$${order.discount.toFixed(2)}`, 400, y);
    y += 15;
  }
  
  doc.font("Helvetica-Bold").text(`Final Amount: $${order.finalAmount.toFixed(2)}`, 400, y);
  
  doc.end();
};
