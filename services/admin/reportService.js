import mongoose from "mongoose";
import Order from "../../models/Order.js";
import User from "../../models/User.js"; 
import Product from "../../models/products.js"; 

// Helper 1: Build Date Query (Dates ONLY)
const buildBaseDateQuery = (filter, startDate, endDate) => {
  let query = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === "daily") {
    query.createdAt = { $gte: today };
  } else if (filter === "weekly") {
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    query.createdAt = { $gte: lastWeek };
  } else if (filter === "yearly") {
    const lastYear = new Date(today);
    lastYear.setFullYear(today.getFullYear() - 1);
    query.createdAt = { $gte: lastYear };
  } else if (filter === "custom" && startDate && endDate) {
    const customStartDate = new Date(startDate);
    customStartDate.setHours(0, 0, 0, 0);
    const customEndDate = new Date(endDate);
    customEndDate.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: customStartDate, $lte: customEndDate };
  }
  return query;
};

// Helper 2: Build Revenue Query
const buildValidOrderQuery = (filter, startDate, endDate) => {
  const query = buildBaseDateQuery(filter, startDate, endDate);
  query.status = { $in: ["Delivered", "Confirmed", "Paid"] };
  return query;
};

// Helper 3: Build Universal Order Search Query
const buildOrderSearchQuery = async (baseQuery, ordersSearch) => {
  if (ordersSearch) {
    const regex = new RegExp(ordersSearch, 'i');
    
    // Find matching Users and Products
    const users = await User.find({ $or: [{ email: regex }, { name: regex }, { firstName: regex }] }).select('_id');
    const products = await Product.find({ title: regex }).select('_id');

    // Check if the search term is a valid number for exact Revenue matches
    const isNumeric = !isNaN(Number(ordersSearch)) && ordersSearch.trim() !== "";

    const orConditions = [
      { paymentMethod: regex },                                    // Search Payment Method
      { user: { $in: users.map(u => u._id) } },                    // Search Customer
      { 'items.product': { $in: products.map(p => p._id) } },      // Search Products
      
      // Convert _id to string and search (Order ID fallback)
      { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: ordersSearch, options: "i" } } },
      
      // Convert orderId to string and search (if you use custom orderIds)
      { $expr: { $regexMatch: { input: { $toString: { $ifNull: ["$orderId", ""] } }, regex: ordersSearch, options: "i" } } },
      
      // Convert Date to string YYYY-MM-DD and search
      { $expr: { $regexMatch: { input: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, regex: ordersSearch, options: "i" } } }
    ];

    if (isNumeric) {
      orConditions.push({ finalAmount: Number(ordersSearch) });    // Exact match for Revenue
      // Also allow partial match for revenue by stringifying it
      orConditions.push({ $expr: { $regexMatch: { input: { $toString: "$finalAmount" }, regex: ordersSearch, options: "i" } } });
    }

    baseQuery.$or = orConditions;
  }
  return baseQuery;
};

const reportService = {
  // Fetch ALL valid orders (Used for PDF/Excel exports)
  getAllFilteredOrders: async (filter, startDate, endDate, ordersSearch = "") => {
    let query = buildValidOrderQuery(filter, startDate, endDate);
    query = await buildOrderSearchQuery(query, ordersSearch);

    return await Order.find(query)
      .populate("user")
      .populate("items.product")
      .sort({ createdAt: -1 });
  },

  // 1. Fetch individual orders WITH PAGINATION & UNIVERSAL SEARCH
  getFilteredOrders: async (filter, startDate, endDate, page = 1, limit = 5, ordersSearch = "") => {
    let query = buildValidOrderQuery(filter, startDate, endDate);
    const skip = (page - 1) * limit;

    query = await buildOrderSearchQuery(query, ordersSearch);
    
    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("user")
      .populate("items.product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { 
      orders, 
      totalPages: Math.ceil(totalOrders / limit) || 1, 
      currentPage: page 
    };
  },

  // 2. Fetch Best Customers 
  getBestCustomers: async (filter, startDate, endDate) => {
    const query = buildValidOrderQuery(filter, startDate, endDate);
    return await Order.aggregate([
      { $match: query },
      { $group: { _id: "$user", totalOrders: { $sum: 1 }, totalAmount: { $sum: "$finalAmount" } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { _id: 0, userId: "$user._id", firstName: "$user.firstName", lastName: "$user.lastName", name: "$user.name", email: "$user.email", totalOrders: 1, totalAmount: 1 } },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 }
    ]);
  },

  // 3. Fetch Category Performance WITH PAGINATION & UNIVERSAL SEARCH
  getCategoryPerformance: async (filter, startDate, endDate, page = 1, limit = 5, catSearch = "") => {
    const query = buildValidOrderQuery(filter, startDate, endDate);
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: query },
      { $unwind: "$items" },
      { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "productDetails" } },
      { $unwind: "$productDetails" },
      { $lookup: { from: "categories", localField: "productDetails.category", foreignField: "_id", as: "categoryDetails" } },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: { categoryId: "$categoryDetails._id", categoryName: { $ifNull: ["$categoryDetails.name", "$categoryDetails.title"] }, productName: "$productDetails.title" },
          productQuantity: { $sum: "$items.quantity" },
          productRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { productQuantity: -1 } },
      {
        $group: {
          _id: "$_id.categoryId",
          categoryName: { $first: "$_id.categoryName" },
          totalOrders: { $sum: "$productQuantity" },
          totalRevenue: { $sum: "$productRevenue" },
          topSellingBook: { $first: "$_id.productName" }
        }
      },
      { $sort: { totalOrders: -1 } }
    ];

    // Apply Universal Search Logic for Categories
    if (catSearch) {
      const regex = new RegExp(catSearch, 'i');
      pipeline.push({
        $match: {
          $or: [ 
            { categoryName: regex },                                                                                 // Search Category Name
            { topSellingBook: regex },                                                                               // Search Top Selling Item
            { $expr: { $regexMatch: { input: { $toString: "$totalOrders" }, regex: catSearch, options: "i" } } },    // Search Total Orders
            { $expr: { $regexMatch: { input: { $toString: "$totalRevenue" }, regex: catSearch, options: "i" } } }    // Search Revenue Generated
          ]
        }
      });
    }

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    });

    const result = await Order.aggregate(pipeline);
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    
    return {
      categoryData: result[0].data,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page
    };
  },

  // 4. Fetch Dynamic Chart Data
  getChartData: async (filter, startDate, endDate) => {
    const baseQuery = buildBaseDateQuery(filter, startDate, endDate); 
    const revenueQuery = buildValidOrderQuery(filter, startDate, endDate); 

    const statusStats = await Order.aggregate([
        { $match: baseQuery },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const donutLabels = [];
    const donutData = [];
    const donutColors = [];
    const colorMap = { "Delivered": "#38bdf8", "Pending": "#fb7185", "Confirmed": "#34d399", "Cancelled": "#94a3b8", "Returned": "#fbbf24" };

    statusStats.forEach(stat => {
        if(stat._id) {
            donutLabels.push(stat._id);
            donutData.push(stat.count);
            donutColors.push(colorMap[stat._id] || "#000000");
        }
    });

    const revStats = await Order.aggregate([
        { $match: revenueQuery },
        { $group: { _id: { $month: "$createdAt" }, revenue: { $sum: "$finalAmount" } } },
        { $sort: { "_id": 1 } }
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const lineLabels = [];
    const lineData = [];

    if (revStats.length > 0) {
        revStats.forEach(stat => {
            lineLabels.push(months[stat._id - 1]);
            lineData.push(stat.revenue);
        });
    } else {
        lineLabels.push(months[new Date().getMonth()]);
        lineData.push(0);
    }

    return { donut: { labels: donutLabels, data: donutData, colors: donutColors }, line: { labels: lineLabels, data: lineData } };
  },

  // 5. Calculate Summary Stats
  calculateSummary: async (filter, startDate, endDate) => {
    const query = buildValidOrderQuery(filter, startDate, endDate);
    const result = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, salesCount: { $sum: 1 }, totalSales: { $sum: "$finalAmount" }, totalDiscounts: { $sum: "$offerDiscount" }, totalCoupons: { $sum: "$couponDiscount" } } }
    ]);

    if (result.length > 0) {
      return {
        salesCount: result[0].salesCount,
        totalSales: result[0].totalSales || 0,
        totalDiscounts: result[0].totalDiscounts || 0,
        totalCoupons: result[0].totalCoupons || 0
      };
    }
    return { salesCount: 0, totalSales: 0, totalDiscounts: 0, totalCoupons: 0 };
  }
};

export default reportService;