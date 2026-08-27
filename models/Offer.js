import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["product", "category", "referral"],
      required: true
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0
    },
    productRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null
    },
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category", // matching the export name in category.js
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      required: true // Added for form validation mapping
    },
    expiryDate: {
      type: Date,
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false // Added to support the Soft Delete functionality
    }
  },
  {
    timestamps: true
  }
);

// Modern Mongoose approach: Just throw errors instead of using the next() callback
offerSchema.pre("save", function () {
  if (this.type === "product" && !this.productRef) {
    throw new Error("Product offers must have a product reference.");
  }
  if (this.type === "category" && !this.categoryRef) {
    throw new Error("Category offers must have a category reference.");
  }
});

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;