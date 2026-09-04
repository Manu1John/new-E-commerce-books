// Adjust the import path depending on your specific folder structure
import dashboardService from "../../services/admin/dashboardService.js"; 

export const getAdminDashboard = async (req, res) => {
  try {
    // Fetch all required data from the service layer
    const dashboardData = await dashboardService.getDashboardMetrics();

    return res.render("admin/dashboard", {
      title: "Admin Dashboard",
      cssFile: "dashboard.css",
      jsFile: "dashboard.js",
      stats: dashboardData.stats,
      recentOrders: dashboardData.recentOrders,
      topProducts: dashboardData.topProducts,
      chartData: dashboardData.chartData
    });
  } catch (error) {
    console.error("GET ADMIN DASHBOARD ERROR:", error);
    return res.status(500).send("Internal Server Error");
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const topProducts = await dashboardService.getAllTopProducts();
    
    return res.render("admin/topProducts", {
      title: "Top Selling Products",
      cssFile: "dashboard.css", // or a specific CSS if needed, using dashboard.css for now
      jsFile: "dashboard.js",
      topProducts
    });
  } catch (error) {
    console.error("GET TOP PRODUCTS ERROR:", error);
    return res.status(500).send("Internal Server Error");
  }
};