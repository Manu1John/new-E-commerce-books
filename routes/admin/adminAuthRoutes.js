import express from "express";
import {getAdminLogin,
    postAdminLogin,
    postAdminLogout
} from '../../controlers/admin/authControler.js';
import {
    disableCache,
    markAdminAuthPage,
    isAuthenticated
} from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(markAdminAuthPage);

// Login page
router.get(
    "/login",
    disableCache,
    markAdminAuthPage,
    getAdminLogin
);

// Login submit
router.post(
    "/login",
    postAdminLogin
);

// Logout
router.post(
    "/logout",
    isAuthenticated,
    postAdminLogout
);

export default router;