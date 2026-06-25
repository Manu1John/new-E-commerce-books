import express from "express";
import otpControler from "../../controlers/user/otpControler.js";
import {
    disableCache,
    markAuthFlowPage,
    redirectLoggedInUser,
    authenticatedUser
} from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/verify-otp",
    markAuthFlowPage,
    disableCache,
    redirectLoggedInUser,
    otpControler.getVerifyOtp
);

router.post(
    "/verify-otp",
    disableCache,
    redirectLoggedInUser,
    otpControler.verifyOtp
);

router.post(
    "/signup/resend-otp",
    disableCache,
    redirectLoggedInUser,
    otpControler.resendOtp
);

router.get(
    "/verify-forgot-otp",
    markAuthFlowPage,
    disableCache,
    redirectLoggedInUser,
    otpControler.getForgotOtpPage
);

router.post(
    "/verify-forgot-otp",
    redirectLoggedInUser,
    otpControler.verifyForgotOtp
);

router.post("/resend-forgot-otp", disableCache, redirectLoggedInUser, otpControler.resendForgotOtp);


router.post(
    "/send-email-otp",
    authenticatedUser,
    otpControler.sendEmailOtp
);

router.patch(
    "/verify-email-otp",
    authenticatedUser,
    otpControler.verifyEmailOtp
);

export default router;