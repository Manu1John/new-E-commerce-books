
import Product from '../models/products.js';
import fs from 'fs'
const createProduct = async (productData, files) => {
    const { title, category, author, description, price, quantity, status } = productData;

    // Check if product exists
    const existProduct = await Product.findOne({title:title.toLowerCase() });

    if (existProduct) {
        // Cleanup orphaned files
        if (files && files.length > 0) {
            files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error("Error deleting orphan file:", err);
                });
            });
        }
        throw new Error("Product already exists");
    }

    // Extract filenames
    const imageFiles = files ? files.map(file => file.filename) : [];

    // Save to database
    const newProduct = new Product({
        title: title.trim(),
        category,
        author,
        description,
        price,
        quantity,
        status,
        images: imageFiles
    });

    return await newProduct.save();
};

export default {
    createProduct
};