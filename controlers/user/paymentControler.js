import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Wallet from "../../models/Wallet.js";
import Product from "../../models/products.js";
import { catchAsync } from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import { calculateCartTotal, decrementOrderStock } from "../../services/user/orderService.js";

// Initialize Razorpay lazily so dotenv can populate process.env first
let razorpayInstance = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpayInstance;
};

const paymentControler = {
  createOrder: catchAsync(async (req, res, next) => {
      const userId = req.session?.user?._id || req.session?.user?.id || req.user?._id;
      
      // FIX: Extract paymentMethod sent from the frontend
      let { addressId, useWallet, couponDiscount = 0, couponId = null, paymentMethod: requestedPaymentMethod } = req.body;

      const cart = await Cart.findOne({ user: userId });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }

      const mongoose = (await import("mongoose")).default;
      let actualCouponDiscount = 0;
      if (couponId && mongoose.Types.ObjectId.isValid(couponId)) {
        const Coupon = (await import("../../models/Coupon.js")).default;
        const coupon = await Coupon.findById(couponId);
        
        if (coupon && coupon.isActive && !coupon.isDeleted && new Date() <= coupon.expiryDate && !coupon.usedBy.includes(userId)) {
          // Check min purchase amount against cart subtotal BEFORE offer discount
          const tempCartData = await calculateCartTotal(cart, 0);
          if (tempCartData.subtotal >= coupon.minPurchaseAmount) {
             if (coupon.discountType === "flat") {
                actualCouponDiscount = coupon.discountValue;
             } else if (coupon.discountType === "percentage") {
                actualCouponDiscount = (tempCartData.subtotal * coupon.discountValue) / 100;
                if (coupon.maxDiscountAmount && actualCouponDiscount > coupon.maxDiscountAmount) {
                  actualCouponDiscount = coupon.maxDiscountAmount;
                }
             }
             // Actually push to usedBy array here, we'll save it after order creation
             coupon.usedBy.push(userId);
             await coupon.save();
          } else {
             couponId = null; // Invalid coupon due to min amount
          }
        } else {
          couponId = null; // Invalid coupon
        }
      }

      const { subtotal, totalOfferDiscount, tax, finalAmount, items } = await calculateCartTotal(cart, actualCouponDiscount);

      let amountToPay = finalAmount;
      
      // FIX: Use the requested method (COD or Online)
      let paymentMethod = requestedPaymentMethod || "Online";
      let walletUsedAmount = 0; // Initialize wallet amount used tracker

      // Handle Wallet Usage safely
      if (useWallet && paymentMethod !== "COD") {
        const wallet = await Wallet.findOne({ user: userId });
        if (wallet && wallet.balance > 0) {
          // Determine how much wallet balance to use
          walletUsedAmount = Math.min(wallet.balance, amountToPay);
          amountToPay -= walletUsedAmount;
          
          if (amountToPay === 0) {
            paymentMethod = "Wallet";
          } else {
            paymentMethod = "Wallet+Online";
          }
        }
      }

      const initialItemStatus = amountToPay === 0 || paymentMethod === "COD" ? "Confirmed" : "Pending";
      items.forEach((item) => {
        item.status = initialItemStatus;
      });

      const newOrder = await Order.create({
        orderId: "ORD" + Date.now(),
        user: userId,
        items,
        shippingAddress: addressId,
        totalAmount: subtotal,
        offerDiscount: totalOfferDiscount,
        couponDiscount: actualCouponDiscount,
        couponApplied: couponId,
        tax: tax,
        finalAmount: finalAmount,
        walletUsed: walletUsedAmount, // Securely record exactly how much wallet balance is pending deduction
        paymentMethod,
        paymentStatus: (amountToPay === 0 || paymentMethod === "COD") ? (paymentMethod === "COD" ? "Pending" : "Paid") : "Pending",
        status: (amountToPay === 0 || paymentMethod === "COD") ? "Confirmed" : "Pending"
      });

      // If fully paid by wallet or it's COD, we don't need Razorpay
      if (amountToPay === 0 || paymentMethod === "COD") {
        if (paymentMethod === "Wallet") {
           const wallet = await Wallet.findOne({ user: userId });
           wallet.balance -= walletUsedAmount;
           wallet.transactions.push({ 
               type: "debit", 
               amount: walletUsedAmount, 
               description: `Payment for Order ${newOrder.orderId}` 
           });
           await wallet.save();
        }

        await decrementOrderStock(newOrder);
        
        await Cart.findOneAndDelete({ user: userId }); // Clear cart
        req.session.lastOrderId = newOrder._id.toString();
        
        return res.json({ 
            success: true, 
            walletOnly: paymentMethod === "Wallet", 
            isCOD: paymentMethod === "COD", 
            orderId: newOrder.orderId,
            redirectUrl: `/orders/success/${newOrder._id}`
        });
      }

      // Create Razorpay Order
      const options = {
        amount: Math.round(amountToPay * 100), // Amount in paise
        currency: "INR",
        receipt: newOrder.orderId
      };

      const razorpayOrder = await getRazorpay().orders.create(options);
      
      res.json({
        success: true,
        razorpayOrder,
        orderId: newOrder._id,
        key_id: process.env.RAZORPAY_KEY_ID // FIX: Send the Key ID securely to the frontend
      });
  }),

  verifyPayment: catchAsync(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
    const userId = req.session?.user?._id || req.session?.user?.id || req.user?._id;

    // Create our own signature to verify
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dummy_secret")
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is mathematically verified
      const order = await Order.findById(order_id);
      const wasAlreadyPaid = order.paymentStatus === "Paid";
      
      order.paymentStatus = "Paid";
      order.status = "Confirmed";
      order.items.forEach((item) => {
        if (!item.status || item.status === "Ordered" || item.status === "Pending") {
          item.status = "Confirmed";
        }
      });
      
      // Safely deduct wallet ONLY using the securely stored 'walletUsed' amount
      if (order.paymentMethod === "Wallet+Online") {
        const wallet = await Wallet.findOne({ user: userId });
        
        wallet.balance -= order.walletUsed; 
        wallet.transactions.push({ 
            type: "debit", 
            amount: order.walletUsed, 
            description: `Partial payment for Order ${order.orderId}` 
        });
        await wallet.save();
      }
      
      await order.save();
      if (!wasAlreadyPaid) {
        await decrementOrderStock(order);
      }
      
      // Clear the user's cart
      await Cart.findOneAndDelete({ user: userId });
      req.session.lastOrderId = order._id.toString();

      res.json({
        success: true,
        message: "Payment verified successfully",
        redirectUrl: `/orders/success/${order._id}`
      });
    } else {
      throw new AppError("Invalid signature", 400);
    }
  }),

  paymentSuccess: (req, res) => {
    const redirectUrl = req.session?.lastOrderId ? `/orders/success/${req.session.lastOrderId}` : "/orders";
    res.redirect(redirectUrl);
  },

  paymentFailureCallback: catchAsync(async (req, res, next) => {
      const { order_id } = req.body;
      if (!order_id) throw new AppError("Order ID required", 400);

      const order = await Order.findById(order_id);
      if (order && order.paymentStatus === "Pending") {
        order.paymentStatus = "Failed";
        order.status = "Payment Failed";
        order.items.forEach(item => {
          if (!item.status || item.status === "Pending") {
            item.status = "Payment Failed";
          }
        });
        await order.save();
        
        const userId = req.session?.user?._id || req.session?.user?.id || req.user?._id;

        // Restore coupon if applied
        if (order.couponApplied) {
          const Coupon = (await import("../../models/Coupon.js")).default;
          await Coupon.findByIdAndUpdate(order.couponApplied, { $pull: { usedBy: userId } });
        }
        
        // Also ensure cart is cleared so they don't have duplicate items if they retry from orders page
        await Cart.findOneAndDelete({ user: userId });
      }
      res.json({ success: true });
  }),

  paymentFailure: (req, res) => {
    res.render("user/payment/failure", { title: "Payment Failed" });
  },

  retryPayment: catchAsync(async (req, res, next) => {
      const { orderId } = req.params;
      const order = await Order.findById(orderId);
      if (!order || order.paymentStatus !== "Failed") {
        throw new AppError("Invalid order or order is not in failed state", 400);
      }

      const amountToPay = order.finalAmount - (order.walletUsed || 0);

      const options = {
        amount: Math.round(amountToPay * 100), // Amount in paise
        currency: "INR",
        receipt: order.orderId
      };

      const razorpayOrder = await getRazorpay().orders.create(options);
      
      res.json({
        success: true,
        razorpayOrder,
        orderId: order._id,
        key_id: process.env.RAZORPAY_KEY_ID 
      });
  })
};

export default paymentControler;
