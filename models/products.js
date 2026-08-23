import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      unique: true,
      lowercase: true,
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true
    },
    author: {
      type: String,
      required: true
    },
    publisher: {
      type: String,
      required: true
    },
    language: {
      type: String,
      required: true
    },
    isbn: {
      type: String,
      required: true
    },
    publicationDate: {
      type: Date,
      required: true
    },
    
    pages: {
      type: Number,
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
      required: true
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

// Add Text Search Index for improved search accuracy
productSchema.index({
  title: 'text',
  author: 'text',
  publisher: 'text',
  isbn: 'text'
}, {
  weights: {
    title: 10,
    author: 5,
    publisher: 3,
    isbn: 2
  },
  name: "ProductTextIndex"
});

const Product = mongoose.model("Product", productSchema);

export default Product;