import Order from "../../models/Order.js";
import User from "../../models/User.js";
import { prepareOrderForView } from "../user/orderService.js";
import { roundMoney } from "../user/pricingService.js";

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

  const wasStockDeducted = order.paymentMethod === "COD" || ["Paid", "Refunded"].includes(order.paymentStatus);
  // 1. Increment Stock ONLY if it wasn't already Cancelled/Returned previously and stock was originally deducted
  if (isBecomingInactive && !wasAlreadyInactive && wasStockDeducted) {
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

  // Check if we are moving to a refunded/cancelled state AND they haven't received a full refund yet
  if (isBecomingInactive && isEligibleForRefund && order.paymentStatus !== "Refunded") {
    
    const Wallet = (await import("../../models/Wallet.js")).default;
    const UserAuthentication = (await import("../../models/User.js")).default; 
    
    let wallet = await Wallet.findOne({ user: order.user });
    
    // Auto-create wallet if it doesn't exist and link it to the User model
    if (!wallet) {
      wallet = await Wallet.create({ user: order.user, balance: 0, transactions: [] });
      await UserAuthentication.findByIdAndUpdate(order.user, { wallet: wallet._id });
    }

    let totalRefundAmount = 0;
    const orderItemsTotal = order.items.reduce((sum, it) => sum + ((it.finalPrice || it.price || 0) * it.quantity), 0);

    for (const item of order.items) {
      if (!item.refundedAmount) {
        const itemTotal = (item.finalPrice || item.price || 0) * item.quantity;
        const proportion = orderItemsTotal > 0 ? (itemTotal / orderItemsTotal) : 0;
        const refundAmount = roundMoney(order.finalAmount * proportion);
        totalRefundAmount += refundAmount;
        item.refundedAmount = refundAmount;
      }
    }

    totalRefundAmount = roundMoney(totalRefundAmount);

    if (totalRefundAmount > 0) {
        order._pendingWalletUpdate = { amount: totalRefundAmount };
    }

    // Update the payment status so they can't be refunded twice
    order.paymentStatus = "Refunded";
  }

  // Finally, update the overarching order status
  order.status = status;
  await order.save(); // Will throw VersionError if modified concurrently

  // FIX: Process Wallet Refund securely with atomic update after order save
  if (order._pendingWalletUpdate) {
    const Wallet = (await import("../../models/Wallet.js")).default;
    await Wallet.findOneAndUpdate(
      { user: order.user },
      {
        $inc: { balance: order._pendingWalletUpdate.amount },
        $push: { transactions: { type: "credit", amount: order._pendingWalletUpdate.amount, description: `Refund for Order ${order.orderId || order._id}` } }
      }
    );
  }

  return prepareOrderForView(order);
};

export const updateOrderItemStatusService = async (orderId, itemId, status) => {
  // First fetch the order to read current state (for business logic checks)
  const order = await Order.findById(orderId).populate("items.product");
  if (!order) throw new Error("Order not found");
  
  const item = order.items.id(itemId);
  if (!item) throw new Error("Order item not found");
  
  // Track the transition states for the item
  const wasAlreadyInactive = ["Returned", "Refunded", "Cancelled"].includes(item.status);
  const isBecomingInactive = ["Returned", "Refunded", "Cancelled"].includes(status);

  const wasStockDeducted = order.paymentMethod === "COD" || ["Paid", "Refunded"].includes(order.paymentStatus);
  
  // 1. Increment Stock ONLY if it wasn't already Cancelled/Returned previously and stock was originally deducted
  if (isBecomingInactive && !wasAlreadyInactive) {
    const Product = (await import("../../models/products.js")).default;
    if (wasStockDeducted) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { quantity: item.quantity }
      });
    }
  } else if (!isBecomingInactive && wasAlreadyInactive) {
    // If somehow reversing a cancellation, decrement stock only if it was originally deducted
    const Product = (await import("../../models/products.js")).default;
    if (wasStockDeducted) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { quantity: -item.quantity }
      });
    }
  }

  // Process item-level wallet refund if becoming inactive and order is paid/wallet
  const isEligibleForRefund = order.paymentStatus === "Paid" || 
                              order.paymentMethod === "Wallet" || 
                              order.paymentMethod === "Wallet+Online";

  if (isBecomingInactive && isEligibleForRefund && !wasAlreadyInactive) {
    const Wallet = (await import("../../models/Wallet.js")).default;
    const UserAuthentication = (await import("../../models/User.js")).default; 
    
    let wallet = await Wallet.findOne({ user: order.user });
    if (!wallet) {
      wallet = await Wallet.create({ user: order.user, balance: 0, transactions: [] });
      await UserAuthentication.findByIdAndUpdate(order.user, { wallet: wallet._id });
    }

    const itemTotal = (item.finalPrice || item.price || 0) * item.quantity;
    const orderItemsTotal = order.items.reduce((sum, it) => sum + ((it.finalPrice || it.price || 0) * it.quantity), 0);
    const proportion = orderItemsTotal > 0 ? (itemTotal / orderItemsTotal) : 0;
    const refundAmount = roundMoney(order.finalAmount * proportion);
    
    item.refundedAmount = refundAmount;
    order._pendingWalletUpdate = { amount: refundAmount };
  }

  // Calculate order-level status
  const allDelivered = order.items.every(i => i._id.toString() === itemId ? status === "Delivered" : i.status === "Delivered");
  const allInactive = order.items.every(i => i._id.toString() === itemId ? isBecomingInactive : ["Cancelled", "Returned", "Refunded"].includes(i.status));

  if (allDelivered) {
    order.status = "Delivered";
  } else if (allInactive) {
    order.status = "Cancelled";
    // FIX: Standardize refund logic on the order level
    if (order.paymentStatus === "Paid") order.paymentStatus = "Refunded";
  } else if (order.status === "Delivered" && !allDelivered) {
    order.status = "Processing"; // rollback
  }

  item.status = status;
  item.statusHistory.push({
    status: status,
    date: new Date(),
    notes: `Status updated to ${status} by Admin`
  });

  // Save order first (relies on optimisticConcurrency to prevent race conditions)
  await order.save();

  // FIX: Process Wallet Refund securely with atomic update after order save
  if (order._pendingWalletUpdate && order._pendingWalletUpdate.amount > 0) {
    const Wallet = (await import("../../models/Wallet.js")).default;
    await Wallet.findOneAndUpdate(
      { user: order.user },
      {
        $inc: { balance: order._pendingWalletUpdate.amount },
        $push: { transactions: { type: "credit", amount: order._pendingWalletUpdate.amount, description: `Refund for Item Cancelled/Returned in Order ${order.orderId || order._id}` } }
      }
    );
  }

  const updatedOrder = await Order.findById(orderId).populate("items.product");
  return prepareOrderForView(updatedOrder);
};

