import express from 'express'
import homeControler from '../../controlers/user/homeControler.js'



import {
    authenticatedUser,
    disableCache
} from "../../middleware/authMiddleware.js";

const router = express.Router()

router.get("/",disableCache,homeControler.getuserIndex);

// Home page
router.get("/home",authenticatedUser,disableCache,homeControler.getHome);

// Product Details page
router.get("/product/:id",disableCache,homeControler.getProductDetails);

export default router;