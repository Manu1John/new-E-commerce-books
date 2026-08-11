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
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");
  
  order.status = status;
  await order.save();
  return order;
};
