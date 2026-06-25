import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      unique: true,
      required: true
    },
            category:{
        type:
            mongoose.Schema.Types.ObjectId,
        ref:"category",
        required:true
    },

    author: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    images: {
      type: [String], // FIXED: supports multiple images
      required:true
    },

    quantity: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;