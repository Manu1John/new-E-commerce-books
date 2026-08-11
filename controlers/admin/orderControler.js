import {
  getAllOrdersService,
  getAdminOrderDetailsService,
  updateOrderStatusService
} from "../../services/admin/orderService.js";

export const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Number(req.query.limit)||5;
    const search = req.query.search || "";
    const statusFilter = req.query.status || "";
    
    const { orders, totalOrders, totalPages } = await getAllOrdersService(page, limit, search, statusFilter);
    
    res.render("admin/orders", {
      title: "Order Management",
      jsFile:"orders.js",
      cssFile:"orders.css",
      orders,
      currentPage: page,
      totalPages,
      search,
      statusFilter,
      totalOrders,
      admin: req.session.admin,

    });
  } catch (error) {
    console.error("GET ALL ORDERS ERROR:", error);
    next(error);
  }
};

export const getAdminOrderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await getAdminOrderDetailsService(orderId);
    res.render("admin/orderDetails", {
      title: "Order Details",
      cssFile:"orderDetails.css",
      jsFile:"orderDetails.js",
      order,
    });
  } catch (error) {
    console.error("GET ADMIN ORDER DETAILS ERROR:", error);
    next(error);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    // FIX: Added the missing statuses from your EJS template 
    const validStatuses = ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned", "Refunded"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }
    
    const order = await updateOrderStatusService(orderId, status);
    return res.status(200).json({ success: true, message: "Order status updated successfully", order });
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

// NEW: Issue Refund Controller
export const issueRefund = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // Note: You will integrate your Payment Gateway refund logic here later.
        
        // Update database to mark as refunded
        const order = await updateOrderStatusService(orderId, "Refunded");
        
        return res.status(200).json({ success: true, message: "Refund processed successfully", order });
    } catch (error) {
        console.error("ISSUE REFUND ERROR:", error);
        return res.status(500).json({ success: false, error: "Failed to process refund" });
    }
};

// NEW: Download Invoice Controller
export const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // Note: You will integrate a PDF library (like pdfkit) here later.
        // This is a placeholder response to prove the wiring works.
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.txt`);
        res.send(`Invoice data for Order ID: ${orderId}`);
        
    } catch (error) {
        console.error("DOWNLOAD INVOICE ERROR:", error);
        res.status(500).send("Failed to generate invoice");
    }
};
export default {
  getAllOrders,
  getAdminOrderDetails,
  updateOrderStatus,
  issueRefund,
  downloadInvoice
};
