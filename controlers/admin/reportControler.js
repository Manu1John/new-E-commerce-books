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
      const summary = await reportService.calculateSummary(filter, startDate, endDate);
      
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="sales-report.pdf"');
      doc.pipe(res);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("Sales Report", { align: "center" });
      doc.moveDown();
      
      doc.fontSize(10).font("Helvetica").text(`Report Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Filter Applied: ${filter || "All"}`);
      if (startDate && endDate) {
         doc.text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`);
      }
      doc.moveDown(2);

      // Summary Section
      doc.fontSize(14).font("Helvetica-Bold").text("Summary Overview");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Total Orders: ${summary.salesCount}`);
      doc.text(`Total Sales Amount: Rs.${summary.totalSales.toFixed(2)}`);
      doc.text(`Total Offer Discounts: Rs.${summary.totalDiscounts.toFixed(2)}`);
      doc.text(`Total Coupon Discounts: Rs.${summary.totalCoupons.toFixed(2)}`);
      doc.moveDown(2);

      // Table Header
      doc.fontSize(12).font("Helvetica-Bold").text("Order Details");
      doc.moveDown(1);
      
      const startY = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Order ID", 40, startY, { width: 100 });
      doc.text("Date", 140, startY, { width: 80 });
      doc.text("Customer", 220, startY, { width: 150 });
      doc.text("Method", 370, startY, { width: 80 });
      doc.text("Amount", 460, startY, { width: 90, align: "right" });
      doc.moveTo(40, startY + 15).lineTo(550, startY + 15).stroke();

      let y = startY + 25;
      doc.font("Helvetica").fontSize(9);

      orders.forEach(order => {
        if (y > 750) {
          doc.addPage();
          y = 40;
          doc.fontSize(10).font("Helvetica-Bold");
          doc.text("Order ID", 40, y, { width: 100 });
          doc.text("Date", 140, y, { width: 80 });
          doc.text("Customer", 220, y, { width: 150 });
          doc.text("Method", 370, y, { width: 80 });
          doc.text("Amount", 460, y, { width: 90, align: "right" });
          doc.moveTo(40, y + 15).lineTo(550, y + 15).stroke();
          y += 25;
          doc.font("Helvetica").fontSize(9);
        }
        
        doc.text(`#${order.orderId || order._id.toString().slice(-6)}`, 40, y, { width: 100 });
        doc.text(new Date(order.createdAt).toLocaleDateString(), 140, y, { width: 80 });
        doc.text(order.user ? (order.user.email || "Guest") : "Guest", 220, y, { width: 150 });
        doc.text(order.paymentMethod || "N/A", 370, y, { width: 80 });
        doc.text(`Rs.${order.finalAmount.toFixed(2)}`, 460, y, { width: 90, align: "right" });
        y += 20;
      });

      doc.end();
    } catch (error) {
      console.error(error);
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