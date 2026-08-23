import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalPrice: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: [
      "Ordered",
      "Pending",
      "Confirmed",
      "Processing",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned",
      "Refunded"
    ],
    default: "Ordered"
  },
  cancellationReason: {
    type: String,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  statusHistory: [
    {
      status: { type: String },
      date: { type: Date, default: Date.now },
      notes: { type: String }
    }
  ]
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAuthentication",
      required: true
    },
    items: [orderItemSchema],
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    },
    shippingFee: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null
    },
    couponDiscount: {
      type: Number,
      default: 0
    },
    offerDiscount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    },
    walletUsed: {
      type: Number,
      default: 0
    },
    paymentMethod: {
      type: String,
      default: "COD"
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending"
    },
    status: {
        type: String,
        required: true,
        // Update this array to include ALL valid statuses
        enum: [
            "Pending", 
            "Ordered",
            "Confirmed", 
            "Processing", 
            "Packed", 
            "Shipped", 
            "Out for Delivery", 
            "Delivered", 
            "Cancelled", 
            "Returned", 
            "Refunded"
        ],
        default: "Pending"
    },
    cancellationReason: {
      type: String,
      default: null
    },
    returnReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
