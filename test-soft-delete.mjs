import mongoose from "mongoose";
import Product from "./models/products.js";
import Category from "./models/category.js";
import { getIndexAndHomeProductsService } from "./services/user/homeService.js";
import 'dotenv/config';

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/E-commerce")
.then(async () => {
    // 1. Create a category
    const cat = new Category({ name: "TestCat", isDeleted: false, status: "active" });
    await cat.save();

    // 2. Create an active product
    const p1 = new Product({
        title: "Active Prod", category: cat._id, author: "A", publisher: "P", language: "L", isbn: "123",
        publicationDate: new Date(), pages: 100, price: 10, description: "D", images: ["img"], quantity: 10,
        isDeleted: false, status: "active"
    });
    await p1.save();

    // 3. Create a soft deleted product
    const p2 = new Product({
        title: "Deleted Prod", category: cat._id, author: "A", publisher: "P", language: "L", isbn: "124",
        publicationDate: new Date(), pages: 100, price: 10, description: "D", images: ["img"], quantity: 10,
        isDeleted: true, status: "active"
    });
    await p2.save();

    // 4. Run the service
    const data = await getIndexAndHomeProductsService({});
    
    console.log("All Products count:", data.allProducts.length);
    data.allProducts.forEach(p => console.log(p.title, p.isDeleted));

    console.log("Featured Products count:", data.featuredProducts.length);
    data.featuredProducts.forEach(p => console.log(p.title, p.isDeleted));

    // Cleanup
    await Product.deleteMany({});
    await Category.deleteMany({});
    mongoose.disconnect();
})
.catch(err => console.error(err));
