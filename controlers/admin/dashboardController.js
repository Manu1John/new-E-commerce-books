import Order from "../../models/Order.js";
import Product from "../../models/products.js";
import Category from "../../models/category.js";
import User from "../../models/User.js";

export const getAdminDashboard = async (req, res) => {
  try {
    // 1. KPI Counts & Revenue Summary
    const totalUsers = await User.countDocuments({ isBlocked: { $ne: true } });
    const totalProducts = await Product.countDocuments({ isDeleted: { $ne: true } });
    const totalOrders = await Order.countDocuments({});

    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ["Delivered", "Confirmed", "Paid"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$finalAmount" } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // 2. Recent 5 Orders
    const recentOrders = await Order.find({})
      .populate("user", "name firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(5);

    // 3. Monthly Revenue (Current Year)
    const currentYear = new Date().getFullYear();
    const monthlyStats = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
          },
          status: { $in: ["Delivered", "Confirmed", "Paid"] }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$finalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenue = Array(12).fill(0);
    monthlyStats.forEach(stat => {
      monthlyRevenue[stat._id - 1] = stat.total;
    });

    // 4. Order Status Breakdown for Donut Chart
    const statusStats = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const orderStatusLabels = [];
    const orderStatusCounts = [];
    statusStats.forEach(stat => {
      if (stat._id) {
        orderStatusLabels.push(stat._id);
        orderStatusCounts.push(stat.count);
      }
    });

    // 5. Top 5 Best-Selling Products
    const topProducts = await Order.aggregate([
      { $match: { status: { $in: ["Delivered", "Confirmed", "Paid"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" }
    ]);

    return res.render("admin/dashboard", {
      title: "Admin Dashboard",
      cssFile: "dashboard.css",
      jsFile: "dashboard.js",
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalUsers
      },
      recentOrders,
      topProducts,
      chartData: {
        months,
        monthlyRevenue,
        orderStatusLabels,
        orderStatusCounts
      }
    });
  } catch (error) {
    console.error("GET ADMIN DASHBOARD ERROR:", error);
    return res.status(500).send("Internal Server Error");
  }
};

export default {
  getAdminDashboard
};