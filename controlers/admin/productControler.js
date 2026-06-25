import Product from '../../models/products.js';
import Category
from "../../models/category.js";
import productService from '../../services/productService.js';
import fs from 'fs'
const getProductDashboard =
async (req, res) => {

    try {

        const page =
            parseInt(req.query.page) || 1;

        const limit = 4;

        const skip =
            (page - 1) * limit;

        const search =
            req.query.search?.trim() || "";

        // BASE QUERY
        const query = {
            isDeleted: false
        };

        // SEARCH
if (search) {

    const categories = await Category.find({
        name: {
            $regex: search,
            $options: "i"
        }
    }).select("_id");

    const categoryIds = categories.map(cat => cat._id);

    query.$or = [
        {
            title: {
                $regex: search,
                $options: "i"
            }
        },
        {
            author: {
                $regex: search,
                $options: "i"
            }
        },
        {
            category: {
                $in: categoryIds
            }
        }
    ];
}


        // GET PRODUCTS
        const productData =
            await Product.find(query)

                // POPULATE CATEGORY
                .populate("category")

                .sort({
                    createdAt: -1
                })

                .skip(skip)

                .limit(limit);


        // COUNT PRODUCTS
        const totalProducts =
            await Product.countDocuments(
                query
            );


        // TOTAL PAGES
        const totalPages =
            Math.ceil(
                totalProducts / limit
            );


        // RENDER PAGE
        return res.render(
            "admin/products",
            {
                title:
                    "Product Page",

                cssFile:
                    "products.css",

                jsFile:
                    "products.js",

                pro:
                    productData,

                totalProducts,

                totalPages,

                currentPage:
                    page,

                search  
            }
        );

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            error:
                error.message
        });
    }
};

const getaddProductPage =
async (req,res)=>{

    try{

        const categories =
            await Category.find({
                isDeleted:false
            });

        return res.render(
            "admin/addProduct",
            {
                title:
                    "add products",
                cssFile:
                    "addProducts.css",
                jsFile:
                    "addProdcuts.js",
                categories
            }
        );

    }catch(error){

        console.log(error);

        res.status(500).json({
            error:error.message
        });
    }
}
const postAddProductPage = async (req, res) => {
    try {
        // 1. Pass the form body data and Multer files to your service layer
        await productService.createProduct(req.body, req.files);
        
        console.log("Product Saved Successfully!");

        // 2. Since frontend always uses fetch(), ALWAYS reply with clean JSON
        return res.status(200).json({ 
            success: true, 
            redirectUrl: "/admin/products" 
        });

    } catch (error) {
        console.error("Backend Error caught in controller:", error.message);
        
        // 3. File Cleanup: Delete files Multer just saved so they don't clutter your disk
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error("Error clearing orphan file during crash:", err);
                });
            });
        }

        // 4. Send the clean error message directly back to the frontend fetch script
        return res.status(400).json({ error: error.message });
    }
};
const getEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('category');
        const categories = await Category.find({});

        if (!product) {
            return res.redirect('/admin/products');
        }

        // Render your new edit view, passing the existing data
        res.render('admin/editProduct',{
            title:"edit product",
            cssFile:'editProduct.css',
            jsFile:'editProducts.js',
             product, 
             categories });
    } catch (error) {
        console.error("Error loading edit page:", error);
        res.status(500).send("Internal Server Error");
    }
};
const postEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { title, category, author, description, price, quantity, status } = req.body;

        // 1. Find the current book data first
        const currentProduct = await Product.findById(productId);
        if (!currentProduct) {
            return res.status(404).json({ error: "Product not found" });
        }

        // 2. Decide on images: use new ones if uploaded, otherwise keep old ones
        let finalImages = currentProduct.images; 
        if (req.files && req.files.length > 0) {
            finalImages = req.files.map(file => file.filename);
        }

        // 3. Update the database record cleanly
        await Product.findByIdAndUpdate(productId, {
            title,
            category,
            author,
            description,
            price,
            quantity,
            status,
            images: finalImages
        });

        // 🎉 FIXED: Send a success JSON packet back to the fetch request!
        return res.json({ redirectUrl: "/admin/products" });

    } catch (error) {
        console.error("Backend Edit Error:", error);
        return res.status(500).json({ error: "Failed to update product details." });
    }
};

const softDeleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Apply soft delete flags
        await Product.findByIdAndUpdate(productId, {
            isDeleted: true,
            deletedAt: new Date()
        });

        //  Return clean JSON to the frontend fetch execution sequence
        return res.json({ 
            success: true, 
            message: "Product soft-deleted successfully.",
            redirectUrl: "/admin/products" 
        });

    } catch (error) {
        console.error("Soft Delete Error:", error);
        return res.status(500).json({ error: "Server error during product removal." });
    }
};

export default {
    getProductDashboard,
    getaddProductPage,
    postAddProductPage,
    getEditProduct,
    postEditProduct,
    softDeleteProduct
}