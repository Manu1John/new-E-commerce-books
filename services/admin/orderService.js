import Order from "../../models/Order.js";

export const getAllOrdersService = async (page, limit, search, statusFilter) => {
  const skip = (page - 1) * limit;
  let query = {};
  
  if (search) {
    query.orderId = { $regex: search, $options: "i" };
  }
  if (statusFilter) {
    query.status = statusFilter;
  }

  const orders = await Order.find(query)
    .populate("user", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(query);
  return { orders, total, totalPages: Math.ceil(total / limit) };
};

export const getAdminOrderDetailsService = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("user", "firstName lastName email phone")
    .populate("items.product")
    .populate("shippingAddress");
  return order;
};

export const updateOrderStatusService = async (orderId, status) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");
  
  order.status = status;
  await order.save();
  return order;
};
