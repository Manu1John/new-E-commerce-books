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
      min: 0,
      max: 100
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
    expiryDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure a product or category offer actually has the reference set
offerSchema.pre("save", function (next) {
  if (this.type === "product" && !this.productRef) {
    return next(new Error("Product offers must have a product reference."));
  }
  if (this.type === "category" && !this.categoryRef) {
    return next(new Error("Category offers must have a category reference."));
  }
  next();
});

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
