import mongoose from "mongoose";
import Product from "./models/products.js"; // adjust the path if needed

await mongoose.connect("mongodb://localhost:27017/mydb");

const products = await Product.find();

for (const product of products) {
  product.title = product.title.toLowerCase();
  await product.save();
}

console.log("Done!");

await mongoose.disconnect();