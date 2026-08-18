import Order from "../../models/Order.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

// Helper 1: Build Date Query (Dates ONLY - used for Order Status Donut Chart)
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

// Helper 2: Build Revenue Query (Dates + Valid Statuses - used for Revenue, Tables, etc.)
const buildValidOrderQuery = (filter, startDate, endDate) => {
  const query = buildBaseDateQuery(filter, startDate, endDate);
  query.status = { $in: ["Delivered", "Confirmed", "Paid"] };
  return query;
};

// 1. Fetch individual orders for Tables & Downloads
const getFilteredOrders = async (filter, startDate, endDate) => {
  const query = buildValidOrderQuery(filter, startDate, endDate);
  return await Order.find(query).populate("user").populate("items.product").sort({ createdAt: -1 });
};

// 2. Fetch Best Customers
const getBestCustomers = async (filter, startDate, endDate) => {
  const query = buildValidOrderQuery(filter, startDate, endDate);
  
  return await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$user",
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: "$finalAmount" } 
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        firstName: "$user.firstName",
        lastName: "$user.lastName",
        name: "$user.name", 
        email: "$user.email",
        totalOrders: 1,
        totalAmount: 1
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 5 }
  ]);
};

// 3. Fetch Category Performance
const getCategoryPerformance = async (filter, startDate, endDate) => {
  const query = buildValidOrderQuery(filter, startDate, endDate);

  return await Order.aggregate([
    { $match: query },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    { $unwind: "$productDetails" },
    {
      $lookup: {
        from: "categories",
        localField: "productDetails.category",
        foreignField: "_id",
        as: "categoryDetails"
      }
    },
    { $unwind: "$categoryDetails" },
    {
      $group: {
        _id: {
          categoryId: "$categoryDetails._id",
          categoryName: { $ifNull: ["$categoryDetails.name", "$categoryDetails.title"] },
          productName: "$productDetails.title"
        },
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
  ]);
};

// 4. Fetch Dynamic Chart Data
const getChartData = async (filter, startDate, endDate) => {
  const baseQuery = buildBaseDateQuery(filter, startDate, endDate); // For Order Status
  const revenueQuery = buildValidOrderQuery(filter, startDate, endDate); // For Revenue Chart

  // A. Order Status Donut Chart Data
  const statusStats = await Order.aggregate([
      { $match: baseQuery },
      { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const donutLabels = [];
  const donutData = [];
  const donutColors = [];
  
  const colorMap = {
      "Delivered": "#38bdf8", // Light Blue
      "Pending": "#fb7185",   // Pink
      "Confirmed": "#34d399", // Green
      "Cancelled": "#94a3b8", // Grey
      "Returned": "#fbbf24"   // Yellow
  };

  statusStats.forEach(stat => {
      if(stat._id) {
          donutLabels.push(stat._id);
          donutData.push(stat.count);
          donutColors.push(colorMap[stat._id] || "#000000");
      }
  });

  // B. Monthly Revenue Line Chart Data
  const revStats = await Order.aggregate([
      { $match: revenueQuery },
      { 
          $group: {
              _id: { $month: "$createdAt" },
              revenue: { $sum: "$finalAmount" }
          }
      },
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
      // Fallback to prevent chart crashing if no data exists for the selected period
      lineLabels.push(months[new Date().getMonth()]);
      lineData.push(0);
  }

  return {
      donut: { labels: donutLabels, data: donutData, colors: donutColors },
      line: { labels: lineLabels, data: lineData }
  };
};

// 5. Calculate Summary Stats
const calculateSummary = (orders) => {
  let totalSales = 0;
  let totalDiscounts = 0;
  let totalCoupons = 0;

  orders.forEach(order => {
    totalSales += order.finalAmount || 0;
    totalDiscounts += order.offerDiscount || 0;
    totalCoupons += order.couponDiscount || 0;
  });

  return { salesCount: orders.length, totalSales, totalDiscounts, totalCoupons };
};

const reportControler = {
  getSalesReport: async (req, res) => {
    try {
      const { filter, startDate, endDate } = req.query;
      
      const orders = await getFilteredOrders(filter || "all", startDate, endDate);
      const bestCustomers = await getBestCustomers(filter || "all", startDate, endDate);
      const categoryPerformance = await getCategoryPerformance(filter || "all", startDate, endDate);
      const chartData = await getChartData(filter || "all", startDate, endDate); // Fetch new chart data
      const summary = calculateSummary(orders);

      res.render("admin/salesReport", { 
        title: "Sales Report",
        useBootstrap: true,
        jsFile: "salesReport.js",
        cssFile: "analytics.css", 
        orders, 
        bestCustomers, 
        categoryPerformance,
        chartData, // Inject into EJS
        summary, 
        filter: filter || "all",
        startDate, 
        endDate 
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  },

  // ... (Keep downloadPDF and downloadExcel exactly as they were in your previous code) ...
  downloadPDF: async (req, res) => { /* Your existing PDF code */ },
  downloadExcel: async (req, res) => { /* Your existing Excel code */ }
};

export default reportControler;