import Order from "../../models/Order.js";
import User from "../../models/User.js";
import { prepareOrderForView } from "../user/orderService.js";

export const getAllOrdersService = async (page, limit, search, statusFilter) => {
    const skip = (page - 1) * limit;
    const filter = {};

    if (search && search.trim()) {
        const searchValue = search.trim();
        const users = await User.find({
          email: {
            $regex: searchValue,
            $options: "i"
          }
        });
        
        // FIX: Changed _Id to _id to correctly map MongoDB ObjectIds
        const userIds = users.map((user) => user._id); 
        
        filter.$or = [
            { orderId: { $regex: searchValue, $options: "i" } },
            { paymentMethod: { $regex: searchValue, $options: "i" } },
            { status: { $regex: searchValue, $options: "i" } },
            // FIX: Changed 'users' to 'user' to match the Order schema reference
            { user: { $in: userIds } } 
        ];
    }

    if (statusFilter) {
        filter.status = statusFilter;
    }

    const orders = await Order.find(filter)
        .populate("user", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalOrders = await Order.countDocuments(filter);

    return {
        orders,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit)
    };
};

export const getAdminOrderDetailsService = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("user", "firstName lastName email phone")
    .populate("items.product")
    .populate("shippingAddress");
  return prepareOrderForView(order);
};         

export const updateOrderStatusService = async (orderId, status) => {
  const order = await Order.findById(orderId).populate("items.product");
  if (!order) throw new Error("Order not found");
  
  // Track the transition states
  const wasAlreadyInactive = ["Returned", "Refunded", "Cancelled"].includes(order.status);
  const isBecomingInactive = ["Returned", "Refunded", "Cancelled"].includes(status);

  // 1. Increment Stock ONLY if it wasn't already Cancelled/Returned previously
  if (isBecomingInactive && !wasAlreadyInactive) {
    const Product = (await import("../../models/products.js")).default;
    for (const item of order.items) {
      const itemStatus = item.status || order.status;
      if (!["Cancelled", "Returned", "Refunded"].includes(itemStatus)) {
        item.status = status;
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { quantity: item.quantity }
        });
      }
    }
  } else {
    for (const item of order.items) {
      const itemStatus = item.status || order.status;
      if (!["Cancelled", "Returned", "Refunded"].includes(itemStatus)) {
        item.status = status;
      }
    }
  }

  // 2. Process Wallet Refund securely
  const isEligibleForRefund = order.paymentStatus === "Paid" || 
                              order.paymentMethod === "Wallet" || 
                              order.paymentMethod === "Wallet+Online";

  // Check if we are moving to a refunded/cancelled state AND they haven't received a refund yet
  if (isBecomingInactive && isEligibleForRefund && order.paymentStatus !== "Refunded") {
    
    const Wallet = (await import("../../models/Wallet.js")).default;
    const UserAuthentication = (await import("../../models/User.js")).default; 
    
    let wallet = await Wallet.findOne({ user: order.user });
    
    // Auto-create wallet if it doesn't exist and link it to the User model
    if (!wallet) {
      wallet = await Wallet.create({ user: order.user, balance: 0, transactions: [] });
      await UserAuthentication.findByIdAndUpdate(order.user, { wallet: wallet._id });
    }

    // Process the refund into the wallet
    wallet.balance += order.finalAmount;
    wallet.transactions.push({
      type: "credit",
      amount: order.finalAmount,
      description: `Refund for Order ${order.orderId || order._id}`
    });
    
    await wallet.save();
    
    // Update the payment status so they can't be refunded twice
    order.paymentStatus = "Refunded";
  }

  // Finally, update the overarching order status
  order.status = status;
  await order.save();
  return prepareOrderForView(order);
};
