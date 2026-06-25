import express from "express"
import categoryControler from '../../controlers/admin/categoryControler.js'
import {
    disableCache,
    isAuthenticated
} from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/category",disableCache,isAuthenticated,categoryControler.getCategoryDashboard)
router.get("/category/add",disableCache,isAuthenticated,categoryControler.getAddCategory)
router.post("/category/add",categoryControler.addCategory)
router.get("/category/:id/edit",disableCache,isAuthenticated,categoryControler.getEditCategory)
router.put("/category/:id/edit",disableCache,isAuthenticated,categoryControler.postEditCategory)
router.delete("/category/:id/delete",disableCache,isAuthenticated,categoryControler.softDeleteCategory)
export default router