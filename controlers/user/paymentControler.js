import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Wallet from "../../models/Wallet.js";
import Product from "../../models/products.js";
import { getItemPricing, roundMoney } from "../../services/user/pricingService.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret"
});

const calculateCartTotal = async (cart, couponDiscount = 0) => {
  let subtotal = 0;
  let totalOfferDiscount = 0;
  const items = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product).populate('category');
    if (!product) continue;
    if (product.isDeleted || product.status !== "active") {
      throw new Error(`"${product.title || "A product"}" is no longer available`);
    }
    if (product.quantity < item.quantity) {
      throw new Error(`"${product.title}" has only ${product.quantity} units available`);
    }

    const itemPricing = await getItemPricing(product, item.quantity);

    subtotal += itemPricing.originalSubtotal;
    totalOfferDiscount += itemPricing.discountSubtotal;

    items.push({
      product: product._id,
      quantity: item.quantity,
      price: itemPricing.finalPrice,
      originalPrice: itemPricing.originalPrice,
      discountPercentage: itemPricing.discountPercentage,
      discountAmount: itemPricing.discountAmount,
      finalPrice: itemPricing.finalPrice,
      subtotal: itemPricing.subtotal,
      status: "Confirmed"
    });
  }

  const finalAmount = roundMoney(Math.max(0, subtotal - totalOfferDiscount - couponDiscount));
  
  return {
    subtotal: roundMoney(subtotal),
    totalOfferDiscount: roundMoney(totalOfferDiscount),
    finalAmount,
    items
  };
};

const decrementOrderStock = async (order) => {
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
  }
};

const paymentControler = {
  createOrder: async (req, res) => {
    try {
      const userId = req.session?.user?._id || req.session?.user?.id || req.user?._id;
      
      // FIX: Extract paymentMethod sent from the frontend
      const { addressId, useWallet, couponDiscount = 0, couponId = null, paymentMethod: requestedPaymentMethod } = req.body;

      const cart = await Cart.findOne({ user: userId });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }

      const { subtotal, totalOfferDiscount, finalAmount, items } = await calculateCartTotal(cart, couponDiscount);

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
        couponDiscount: couponDiscount,
        couponApplied: couponId,
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

      const razorpayOrder = await razorpay.orders.create(options);
      
      res.json({
        success: true,
        razorpayOrder,
        orderId: newOrder._id,
        key_id: process.env.RAZORPAY_KEY_ID // FIX: Send the Key ID securely to the frontend
      });
      
    } catch (error) {
      console.error("Create Order Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  verifyPayment: async (req, res) => {
    try {
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
        res.status(400).json({ success: false, message: "Invalid signature" });
      }
    } catch (error) {
      console.error("Verify Payment Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  paymentSuccess: (req, res) => {
    const redirectUrl = req.session?.lastOrderId ? `/orders/success/${req.session.lastOrderId}` : "/orders";
    res.redirect(redirectUrl);
  },

  paymentFailure: (req, res) => {
    res.render("user/payment/failure", { title: "Payment Failed" });
  }
};

export default paymentControler;
