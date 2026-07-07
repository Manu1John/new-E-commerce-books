import Product from '../../models/products.js';
import Category from "../../models/category.js";
import productService from '../../services/productService.js';
import fs from 'fs'

const getProductDashboard = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search?.trim() || "";

        // BASE QUERY
        const query = { isDeleted: false };

        // SEARCH
        if (search) {
            const categories = await Category.find({
                name: { $regex: search, $options: "i" }
            }).select("_id");

            const categoryIds = categories.map(cat => cat._id);

            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { author: { $regex: search, $options: "i" } },
                { category: { $in: categoryIds } }
            ];
        }

        // GET PRODUCTS
        const productData = await Product.find(query)
            .populate("category")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // COUNT PRODUCTS
        const totalProducts = await Product.countDocuments(query);

        // TOTAL PAGES
        const totalPages = Math.ceil(totalProducts / limit);

        // RENDER PAGE
        return res.render("admin/products", {
            title: "Product Page",
            cssFile: "products.css",
            jsFile: "products.js",
            pro: productData,
            totalProducts,
            totalPages,
            currentPage: page,
            search  
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

const getaddProductPage = async (req,res)=>{
    try{
        const categories = await Category.find({ isDeleted:false });
        return res.render("admin/addProduct", {
            title: "add products",
            cssFile: "addProducts.css",
            jsFile: "addProdcuts.js",
            categories
        });
    }catch(error){
        console.log(error);
        res.status(500).json({ error:error.message });
    }
}

const postAddProductPage = async (req, res) => {
    try {
        await productService.createProduct(req.body, req.files);
        console.log("Product Saved Successfully!");

        // Assuming frontend fetch is used:
        return res.status(200).json({ success: true, redirectUrl: "/admin/products" });

    } catch (error) {
        console.error("Backend Error caught in controller:", error.message);
        
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error("Error clearing orphan file during crash:", err);
                });
            });
        }

        // ====== SSR FALLBACK ======
        // If you stop using fetch() and switch to standard form action submissions, 
        // uncomment the code below to repopulate the form:
        /*
        const categories = await Category.find({ isDeleted: false });
        return res.render("admin/addProduct", {
            title: "add products",
            cssFile: "addProducts.css",
            jsFile: "addProdcuts.js",
            categories,
            product: req.body,
            error: error.message
        });
        */

        // Current JSON return for fetch:
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

        res.render('admin/editProduct',{
            title: "edit product",
            cssFile: 'editProduct.css',
            jsFile: 'editProducts.js',
            product, 
            categories 
        });
    } catch (error) {
        console.error("Error loading edit page:", error);
        res.status(500).send("Internal Server Error");
    }
};

const postEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { title, category, author, description, price, quantity, status } = req.body;

        const currentProduct = await Product.findById(productId);
        if (!currentProduct) {
            return res.status(404).json({ error: "Product not found" });
        }

        let finalImages = [];
        let imageOrder = req.body.imageOrder;

        if (!imageOrder) {
            imageOrder = [];
        } else if (!Array.isArray(imageOrder)) {
            imageOrder = [imageOrder];
        }

        let fileIndex = 0;
        imageOrder.forEach(item => {
            if (item.startsWith('NEW_FILE_')) {
                if (req.files && req.files[fileIndex]) {
                    finalImages.push(req.files[fileIndex].filename);
                    fileIndex++;
                }
            } else {
                finalImages.push(item);
            }
        });

        if (finalImages.length === 0) {
            if (req.files && req.files.length > 0) {
                finalImages = req.files.map(file => file.filename);
            } else {
                finalImages = currentProduct.images;
            }
        }

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

        return res.json({ redirectUrl: "/admin/products" });

    } catch (error) {
        console.error("Backend Edit Error:", error);
        
        // ====== SSR FALLBACK ======
        // Uncomment to use standard form submission repopulation:
        /*
        const productId = req.params.id;
        const categories = await Category.find({});
        return res.status(500).render("admin/editProduct", {
            title: "edit product",
            cssFile: 'editProduct.css',
            jsFile: 'editProducts.js',
            categories,
            product: { _id: productId, ...req.body },
            error: "Failed to update product details."
        });
        */

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

        await Product.findByIdAndUpdate(productId, {
            isDeleted: true,
            deletedAt: new Date()
        });

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