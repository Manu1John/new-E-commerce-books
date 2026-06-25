import express from "express";
import passwordControler from "../../controlers/user/passwordControler.js";
import {
    disableCache,
    markAuthFlowPage,
    redirectLoggedInUser,
    authenticatedUser
} from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/forgot-password",
    markAuthFlowPage,
    disableCache,
    passwordControler.getForgotPassword
);

router.post(
    "/forgot-password",
    passwordControler.postForgotPassword
);

  

router.get(
    "/reset-password",
    markAuthFlowPage,
    disableCache,
    redirectLoggedInUser,
    passwordControler.getResetPassword
);

router.patch(
    "/reset-password",
    redirectLoggedInUser,
    passwordControler.postResetPassword
);

router.patch(
    "/change-password",
    authenticatedUser,
    passwordControler.changePassword
);

export default router;