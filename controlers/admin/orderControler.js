import {
  getAllOrdersService,
  getAdminOrderDetailsService,
  updateOrderStatusService
} from "../../services/admin/orderService.js";

export const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const search = req.query.search || "";
    const statusFilter = req.query.status || "";
    
    const { orders, total, totalPages } = await getAllOrdersService(page, limit, search, statusFilter);
    
    res.render("admin/orders", {
      title: "Order Management",
      orders,
      currentPage: page,
      totalPages,
      search,
      statusFilter,
      admin: req.session.admin,
      success: req.flash("success"),
      error: req.flash("error")
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
    
    if (!order) {
      req.flash("error", "Order not found");
      return res.redirect("/admin/orders");
    }
    
    res.render("admin/order-details", {
      title: "Order Details",
      order,
      admin: req.session.admin,
      success: req.flash("success"),
      error: req.flash("error")
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
    
    const validStatuses = ["Pending", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned"];
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

export default {
  getAllOrders,
  getAdminOrderDetails,
  updateOrderStatus
};
