import mongoose from "mongoose";
import Product from "./models/products.js";
import 'dotenv/config';

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/E-commerce")
.then(async () => {
    // 1. Check total products
    const total = await Product.countDocuments();
    console.log("Total Products:", total);

    // 2. Check products with isDeleted: false
    const countFalse = await Product.countDocuments({ isDeleted: false });
    console.log("Products with isDeleted: false :", countFalse);

    // 3. Check products with isDeleted: true
    const countTrue = await Product.countDocuments({ isDeleted: true });
    console.log("Products with isDeleted: true :", countTrue);

    // 4. Check products without isDeleted field
    const countMissing = await Product.countDocuments({ isDeleted: { $exists: false } });
    console.log("Products with isDeleted missing :", countMissing);

    mongoose.disconnect();
})
.catch(err => console.error(err));
