import {
  getUserOrdersService,
  getOrderDetailsService,
  getOrderSuccessService,
  cancelOrderItemService,
  cancelOrderService,
  returnOrderService,
  returnOrderItemService,
  generateInvoicePDF,
  getTrackOrderItemService
} from "../../services/user/orderService.js";

const getUserId = (req) => req.session?.user?._id || req.session?.user?.id;

export const getUserOrders = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const search = req.query.search || "";
    
    const { orders, total, totalPages } = await getUserOrdersService(userId, page, limit, search);
    
    res.render("user/myOrders", {
      title: "My Orders",
      cssFile:"myOrders.css",
      jsFile:"myOrders.js",
      orders,
      currentPage: page,
      totalPages,
      search,
      user: req.session.user,
      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error("GET USER ORDERS ERROR:", error);
    next(error);
  }
};

export const getOrderDetails = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const orderId = req.params.id;
    
    const order = await getOrderDetailsService(userId, orderId);
    if (!order) {
      req.flash("error", "Order not found");
      return res.redirect("/orders");
    }
    
    res.render("user/order-details", {
      title: "Order Details",
      cssFile: "userOrderDetails.css",
      jsFile: "userOrderDetails.js",
      order,
      user: req.session.user,
      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error("GET ORDER DETAILS ERROR:", error);
    next(error);
  }
};

export const getOrderSuccess = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const order = await getOrderSuccessService(userId, req.params.id);
    if (!order) {
      req.flash("error", "Order not found");
      return res.redirect("/orders");
    }

    if (req.session?.lastOrderId === req.params.id) {
      delete req.session.lastOrderId;
    }

    res.render("user/order-success", {
      title: "Order Placed",
      cssFile: "userOrderDetails.css",
      order,
      user: req.session.user
    });
  } catch (error) {
    console.error("GET ORDER SUCCESS ERROR:", error);
    next(error);
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const orderId = req.params.id;
    const { cancellationReason } = req.body;
    
    const order = await cancelOrderService(userId, orderId, cancellationReason);
    
    return res.status(200).json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("CANCEL ORDER ERROR:", error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const cancelOrderItem = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: orderId, itemId } = req.params;
    const { cancellationReason } = req.body;

    const result = await cancelOrderItemService(userId, orderId, itemId, cancellationReason);

    return res.status(200).json({
      success: true,
      message: "Item cancelled successfully",
      ...result
    });
  } catch (error) {
    console.error("CANCEL ORDER ITEM ERROR:", error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const returnOrderItem = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: orderId, itemId } = req.params;
    const { returnReason } = req.body;

    const result = await returnOrderItemService(userId, orderId, itemId, returnReason);

    return res.status(200).json({
      success: true,
      message: "Item returned successfully",
      ...result
    });
  } catch (error) {
    console.error("RETURN ORDER ITEM ERROR:", error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const returnOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    const orderId = req.params.id;
    const { returnReason } = req.body;
    
    if (!returnReason) {
      return res.status(400).json({ success: false, error: "Return reason is mandatory" });
    }
    
    const order = await returnOrderService(userId, orderId, returnReason);
    
    return res.status(200).json({ success: true, message: "Order return initiated successfully", order });
  } catch (error) {
    console.error("RETURN ORDER ERROR:", error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const downloadInvoice = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const orderId = req.params.id;
    
    const order = await getOrderDetailsService(userId, orderId);
    if (!order) {
      return res.status(404).send("Order not found");
    }
    
    generateInvoicePDF(order, res);
  } catch (error) {
    console.error("DOWNLOAD INVOICE ERROR:", error);
    next(error);
  }
};

export default {
  getUserOrders,
  getOrderDetails,
  getOrderSuccess,
  cancelOrder,
  cancelOrderItem,
  returnOrder,
  returnOrderItem,
  downloadInvoice
};

export const trackOrderItem = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { orderId, itemId } = req.params;
    const { order, item } = await getTrackOrderItemService(userId, orderId, itemId);
    
    res.render("user/trackItem", {
      title: "Track Item",
      cssFile: "trackItem.css",
      jsFile: null,
      user: req.session.user,
      order,
      item
    });
  } catch (error) {
    next(error);
  }
};
