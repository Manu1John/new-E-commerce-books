import express from "express";
import passport from "passport";
import authControler from "../../controlers/user/authControler.js";
import {
    disableCache,
    markAuthFlowPage,
    redirectLoggedInUser
} from "../../middleware/authMiddleware.js";

const router = express.Router();

// Login
router.get(
    "/login",
    markAuthFlowPage,
    disableCache,
    redirectLoggedInUser,
    authControler.getUserLogin
);

router.post(
    "/login",
    redirectLoggedInUser,
    authControler.postUserLogin
);

// Signup
router.get(
    "/signup",
    markAuthFlowPage,
    disableCache,
    redirectLoggedInUser,
    authControler.getUserSignup
);

router.post(
    "/signup",
    redirectLoggedInUser,
    authControler.postUserSignup
);

// Logout
router.post(
    "/logout",
    disableCache,
    authControler.postUserLogout
);

export default router;