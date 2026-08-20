import reportService from "../../services/admin/reportService.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const reportControler = {
  getSalesReport: async (req, res) => {
    try {
      const { filter, startDate, endDate, ordersSearch, catSearch } = req.query;
      const appliedFilter = filter || "all";
      const appliedOrdersSearch = ordersSearch || "";
      const appliedCatSearch = catSearch || "";
      
      const ordersPage = parseInt(req.query.ordersPage) || 1;
      const catPage = parseInt(req.query.catPage) || 1;
      
      // Fetch paginated data (Limit set to 5, passing search queries)
      const orderResult = await reportService.getFilteredOrders(appliedFilter, startDate, endDate, ordersPage, 5, appliedOrdersSearch);
      const catResult = await reportService.getCategoryPerformance(appliedFilter, startDate, endDate, catPage, 5, appliedCatSearch);
      
      const bestCustomers = await reportService.getBestCustomers(appliedFilter, startDate, endDate);
      const chartData = await reportService.getChartData(appliedFilter, startDate, endDate);
      const summary = await reportService.calculateSummary(appliedFilter, startDate, endDate);

      res.render("admin/salesReport", { 
        title: "Sales Report",
        useBootstrap: true,
        jsFile: "salesReport.js",
        cssFile: "analytics.css", 
        orders: orderResult.orders, 
        ordersTotalPages: orderResult.totalPages,
        ordersCurrentPage: orderResult.currentPage,
        categoryPerformance: catResult.categoryData,
        catTotalPages: catResult.totalPages,
        catCurrentPage: catResult.currentPage,
        bestCustomers, 
        chartData,
        summary, 
        filter: appliedFilter,
        startDate, 
        endDate,
        ordersSearch: appliedOrdersSearch,
        catSearch: appliedCatSearch
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  },

  downloadPDF: async (req, res) => { 
    try {
      const { filter, startDate, endDate, ordersSearch } = req.query;
      const orders = await reportService.getAllFilteredOrders(filter, startDate, endDate, ordersSearch);
      
      const doc = new PDFDocument({ margin: 30 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="sales-report.pdf"');
      doc.pipe(res);

      doc.fontSize(20).text("Sales Report", { align: "center" });
      doc.moveDown();

      orders.forEach(order => {
        doc.fontSize(12).text(`Order ID: #${order.orderId || order._id.toString().slice(-6)}`);
        doc.text(`Date: ${order.createdAt.toLocaleDateString()}`);
        doc.text(`Customer: ${order.user ? order.user.email : "Guest"}`);
        doc.text(`Amount: Rs.${order.finalAmount.toFixed(2)}`);
        doc.moveDown();
      });

      doc.end();
    } catch (error) {
      res.status(500).send("Error generating PDF");
    }
  },
  
  downloadExcel: async (req, res) => { 
    try {
      const { filter, startDate, endDate, ordersSearch } = req.query;
      const orders = await reportService.getAllFilteredOrders(filter, startDate, endDate, ordersSearch);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");

      worksheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Order ID", key: "orderId", width: 20 },
        { header: "Customer", key: "customer", width: 25 },
        { header: "Revenue", key: "revenue", width: 15 }
      ];

      orders.forEach(order => {
        worksheet.addRow({
          date: order.createdAt.toLocaleDateString(),
          orderId: order.orderId || order._id.toString().slice(-6),
          customer: order.user ? order.user.email : "Guest",
          revenue: order.finalAmount.toFixed(2)
        });
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="sales-report.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).send("Error generating Excel");
    }
  }
};

export default reportControler;