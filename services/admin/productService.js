
import Product from '../../models/products.js';
import Category from "../../models/category.js"
import fs from 'fs'

export async function getproductDashboardService(page,limit,search){
        const skip = (page-1)*limit
         // BASE QUERY
        const query = { isDeleted: false };
        // SEARCH
        if (search) {
                const matchedCategories = await Category.find({
                name: { $regex: search, $options: "i" }
            }).select("_id");
            const categoryIds = matchedCategories.map(cat => cat._id);
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { author: { $regex: search, $options: "i" } },
                { category: { $in: categoryIds } }
            ];
        }
        const productData = await Product.find(query)
            .populate("category")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        // COUNT PRODUCTS
         const categories = await Category.find();
        const totalProducts = await Product.countDocuments(query);
           // TOTAL PAGES
        const totalPages = Math.ceil(totalProducts / limit);
        return{
            productData,
            categories,
            totalPages
        }  
}

export async function  createProductService  (productData, files) {
    const { title, category, author, description, price, quantity, status,            publisher,
            language,
            isbn,
            publicationDate,
            pages } = productData;

    // Check if product exists
    const existProduct = await Product.findOne({title:title.toLowerCase().trim() });

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
        publisher,
        language,
        isbn,
        publicationDate,
        pages,
        description,
        price,
        quantity,
        status,
        images: imageFiles
    });

    return await newProduct.save();
};

export async function getaddProductPageService(){

    const categories = await Category.find({ isDeleted:false });
    return categories
}
export async function getEditProductService(productId){
    const product = await Product.findById(productId).populate("category")
    const categories = await Category.find({});
    return{
        product,
        categories
    }
}

export async function postEditProductService(productId,productData){
      const { 
     title,
            category,
            author,
            publisher,
            language,
            isbn,
            publicationDate,
            pages,
            description,
            price,
            quantity,
            status,
            images: finalImages 
        } = productData 
    const currentProduct = await Product.findById(productId);
    const updateProducts = await Product.findByIdAndUpdate(productId, {
            title,
            category,
            author,
            publisher,
            language,
            isbn,
            publicationDate,
            pages,
            description,
            price,
            quantity,
            status,
            images: finalImages
        });
    return{
        currentProduct,
        updateProducts
    }
}
export async function softDeleteProductService(productId,pro){
    const product = Product.findById(productId)
    const deleteProduct =       await Product.findByIdAndUpdate(productId, {
            isDeleted: true,
            deletedAt: new Date()
        });
        return{
            product,
            deleteProduct
        }
}

