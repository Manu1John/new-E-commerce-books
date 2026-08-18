import Order from "../../models/Order.js";
import User from "../../models/User.js"
export const getAllOrdersService = async (page, limit, search, statusFilter) => {

    const skip = (page - 1) * limit;

    const filter = {};

    if (search && search.trim()) {
        const searchValue = search.trim();
        const users = await User.find({
          email:{
            $regex:searchValue,
            $options:"i"
          }
        })
        const userIds = users.map((user)=>user._Id)
        filter.$or = [
            {
                orderId: {
                    $regex: searchValue,
                    $options: "i"
                }
            },
            {
                paymentMethod: {
                    $regex: searchValue,
                    $options: "i"
                }
            },
            {
                status: {
                    $regex: searchValue,
                    $options: "i"
                }
            },
            {
              users:{
                $in:userIds
              }
            }
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
  return order;
};         

export const updateOrderStatusService = async (orderId, status) => {
  const order = await Order.findById(orderId).populate("items.product");
  if (!order) throw new Error("Order not found");
  
  // If status is changed to Returned, Refunded, or Cancelled
  if (["Returned", "Refunded", "Cancelled"].includes(status) && !["Returned", "Refunded", "Cancelled"].includes(order.status)) {
    
    // 1. Increment Stock
    const Product = (await import("../../models/products.js")).default;
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { quantity: item.quantity }
      });
    }

    // 2. Process Wallet Refund (Only if they actually paid)
    if (order.paymentStatus === "Paid" || order.paymentMethod === "Wallet" || order.paymentMethod === "Wallet+Online") {
      const Wallet = (await import("../../models/Wallet.js")).default;
      let wallet = await Wallet.findOne({ user: order.user });
      
      if (!wallet) {
        wallet = await Wallet.create({ user: order.user, balance: 0, transactions: [] });
      }

      wallet.balance += order.finalAmount;
      wallet.transactions.push({
        type: "credit",
        amount: order.finalAmount,
        description: `Refund for ${status} Order ${order.orderId}`
      });
      await wallet.save();
      
      order.paymentStatus = "Refunded";
    }
  }

  order.status = status;
  await order.save();
  return order;
};
