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