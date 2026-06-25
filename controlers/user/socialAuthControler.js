import express from 'express'
import bcrypt from "bcrypt";
import AuthService from "../../services/authService.js";
import {
    clearUserSessionCookie,
    createUserSession,
    destroySession
} from "../../utils/sessionUtils.js";


// SIGNUP WITH GOOGLE
const googleAuthCallback = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect("/login");
        }

        if (req.user.isBlocked) {
            await cleanupSessionSafely(req, res, "Google blocked user");
            return res.render("user/loginAndSignup", {
                title: "Signin",
                cssFile: "loginAndSignup.css",
                jsFile: "signupAuth.js",
                error: "Your account has been blocked by an admin",
                success: null,
                isSignup: false
            });
        }

        await createUserSession(req, req.user);
        return res.redirect("/home");

    } catch (error) {
        console.error("Google callback error:", error);
        return res.redirect("/login");
    }
};

// LOGIN WITH FACEBOOK
const facebookAuthCallback = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect("/login");
        }

        if (req.user.isBlocked) {
            await cleanupSessionSafely(req, res, "Facebook blocked user");
            return res.render("user/loginAndSignup", {
                title: "Signin",
                cssFile: "loginAndSignup.css",
                jsFile: "signupAuth.js",
                error: "Your account has been blocked by an admin",
                success: null,
                isSignup: false
            });
        }

        await createUserSession(req, req.user);
        return res.redirect("/home");

    } catch (error) {
        console.error("Facebook callback error:", error);
        return res.redirect("/login");
    }
};

export default {
    googleAuthCallback,
    facebookAuthCallback
}