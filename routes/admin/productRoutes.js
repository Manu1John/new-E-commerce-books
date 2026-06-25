import express from "express"
import productControler from '../../controlers/admin/productControler.js'
import {
    disableCache,
    isAuthenticated
} from "../../middleware/authMiddleware.js";
import upload from "../../config/multer.js";
const router = express.Router();

router.get("/products",disableCache,isAuthenticated,productControler.getProductDashboard)
router.get("/product/add",disableCache,isAuthenticated,productControler.getaddProductPage)
router.post("/product/add",upload.array("images",5),disableCache,isAuthenticated,productControler.postAddProductPage)
router.get("/product/:id/edit",disableCache,isAuthenticated,productControler.getEditProduct)
router.post('/product/:id/edit', upload.array('images', 5),disableCache,isAuthenticated ,productControler.postEditProduct);
router.delete('/product/:id/delete',disableCache,isAuthenticated,productControler.softDeleteProduct)
export default router