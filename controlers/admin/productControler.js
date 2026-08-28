
import {createProductService,
    getproductDashboardService,
    getaddProductPageService,
    getEditProductService,
    postEditProductService,
    softDeleteProductService
} from '../../services/admin/productService.js';
import fs from 'fs'
const getProductDashboard = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const search = req.query.search?.trim() || "";
        const {productData,categories
            ,totalPages,totalProducts} = await getproductDashboardService(page,limit,search)
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
        const categories = await getaddProductPageService()
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
        // 2. ATTEMPT TO SAVE
        await createProductService(req.body, req.files);
        return res.status(200).json({ success: true, redirectUrl: "/admin/products" });
    } catch (error) {
        // 3. IF IT FAILS, PRINT THE EXACT REASON       
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                import('fs').then(fs => {
                    fs.unlink(file.path, (err) => {
                        if (err) console.error("Error clearing orphan file:", err);
                    });
                });
            });
        }
        return res.status(400).json({ error: error.message });
    }
};
const getEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const {product,categories} = await getEditProductService(productId)
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

        // Step 1: Fetch the current product to get existing images
        const currentProduct = await (await import('../../models/products.js')).default.findById(productId);
        if (!currentProduct) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Step 2: Resolve final image list from imageOrder + newly uploaded files
        let finalImages = [];
        let imageOrder = req.body.imageOrder;

        if (!imageOrder) {
            imageOrder = [];
        } else if (!Array.isArray(imageOrder)) {
            imageOrder = [imageOrder];
        }

        let fileIndex = 0;
        for (const item of imageOrder) {
            if (item.startsWith('NEW_FILE_')) {
                if (req.files && req.files[fileIndex]) {
                    finalImages.push(req.files[fileIndex].filename);
                    fileIndex++;
                }
            } else {
                finalImages.push(item);
            }
        }

        // Fallback: if imageOrder wasn't sent, use new files or keep existing
        if (finalImages.length === 0) {
            if (req.files && req.files.length > 0) {
                finalImages = req.files.map(f => f.filename);
            } else {
                finalImages = currentProduct.images;
            }
        }

        // Step 3: Delete orphaned old images that were replaced
        const removedImages = currentProduct.images.filter(img => !finalImages.includes(img));
        if (removedImages.length > 0) {
            const fsModule = await import('fs');
            const pathModule = await import('path');
            const { fileURLToPath } = await import('url');
            removedImages.forEach(img => {
                const filePath = `public/uploads/${img}`;
                fsModule.default.unlink(filePath, (err) => {
                    if (err) console.warn(`Could not delete old image ${img}:`, err.message);
                });
            });
        }

        // Step 4: Save all product fields + resolved images
        await postEditProductService(productId, req.body, finalImages);

        return res.json({ success: true, redirectUrl: "/admin/products" });

    } catch (error) {
        console.error("Backend Edit Error:", error);
        // Clean up any uploaded files if the update failed
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => { if (err) console.error("Orphan file cleanup error:", err); });
            });
        }
        return res.status(500).json({ error: "Failed to update product details." });
    }
};        

const softDeleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await softDeleteProductService(productId)
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
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