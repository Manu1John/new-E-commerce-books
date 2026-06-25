import express from "express";
import passport from "passport";
import socialAuthControler from "../../controlers/user/socialAuthControler.js";
import {
    disableCache,
    redirectLoggedInUser
} from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/auth/google",
    disableCache,
    redirectLoggedInUser,
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account"
    })
);

router.get(
    "/auth/google/callback",
    disableCache,
    passport.authenticate("google", {
        failureRedirect: "/login",
        session: false
    }),
    socialAuthControler.googleAuthCallback
);

router.get(
    "/auth/facebook",
    disableCache,
    redirectLoggedInUser,
    passport.authenticate("facebook", {
        scope: ["email"]
    })
);

router.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", {
        failureRedirect: "/",
        session: false
    }),
    socialAuthControler.facebookAuthCallback
);

export default router;