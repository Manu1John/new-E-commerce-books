import express from 'express'
import AuthService from "../../services/authService.js";
import User from "../../models/User.js";
import bcrypt from "bcrypt";
import {
    clearUserSessionCookie,
    createUserSession,
    destroySession
} from "../../utils/sessionUtils.js";

// 1. Show the "Enter your email" page
const getForgotPassword = (req, res, next) => {
    try {
        return res.render("user/forgotPassword", {
            title: "Forgot Password",
            cssFile: "loginAndSignup.css",
            error: null,
            success: null
        });
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in getForgotPassword controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
    }
};

// POST FORGOT PASSWORD
const postForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.render("user/forgotPassword", {
                title: "Forgot Password",
                cssFile: "loginAndSignup.css",
                error: "Email not found",
                success:null

            });
        }

        // FIXED: Unified implementation through AuthService
        const otp = AuthService.generateOtp();

        req.session.forgotEmail = user.email;
        req.session.forgotOtp = otp;
        req.session.forgotOtpExpires = Date.now() + 2 * 60 * 1000;

        // FIXED: Routing email distribution logic through the modern service layer
        await AuthService.sendPasswordResetOtp(user.email, otp);

        return res.redirect("/verify-forgot-otp");

    } catch (error) {
        console.error(error);
        return res.redirect("/forgot-password");
    }
};


// GET RESET PASSWORD
const getResetPassword = (req, res, next) => {
    try {
        // Safe check: Optional chaining prevents crashes if the session is uninitialized
        if (!req.session?.otpVerified) {
            return res.redirect("/forgot-password");
        }

        return res.render("user/resetPassword", {
            title: "Reset Password",
            cssFile: "loginAndSignup.css",
            error: null
        });
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in getResetPassword controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
    }
};


// POST RESET PASSWORD
const postResetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render("user/resetPassword", {
                title: "Reset Password",
                cssFile: "loginAndSignup.css",
                error: "Passwords do not match"
            });
        }

        const email = req.session.forgotEmail;
        const user = await User.findOne({ email });

        if (!user) {
            return res.redirect("/forgot-password");
        }

        // FIXED: Leveraging the AuthService hashing mechanism 
        const hashedPassword = await AuthService.hashUserPassword(password);

        user.password = hashedPassword;
        await user.save();

        // Clear password reset session data cleanly
        delete req.session.forgotEmail;
        delete req.session.forgotOtp;
        delete req.session.forgotOtpExpires;
        delete req.session.otpVerified;

        return res.redirect("/login");

    } catch (error) {
        console.error(error);
        return res.redirect("/forgot-password");
    }
};


const changePassword = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        // Find user document
        const user = await User.findById(userId);

        if (!user) {
            return res.redirect("/profile/user");
        }

        // Current password check
        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isMatch) {
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user,
                error: "Current password is incorrect"
            });
        }

        // Password match check
        if (newPassword !== confirmPassword) {
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user,
                error: "Passwords do not match"
            });
        }

        // FIXED: Password regex now matches the exact special characters allowed by your frontend JS
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user,
                error: "Password must contain 8+ characters, uppercase, lowercase, number and special character"
            });
        }

        // Prevent same password
        const samePassword = await bcrypt.compare(
            newPassword,
            user.password
        );

        if (samePassword) {
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user,
                error: "New password cannot be same as old password"
            });
        }

        // Hash password manually
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // FIXED: Using standard document assignment and .save() to protect schema hooks consistency
        user.password = hashedPassword;
        const updatedUser = await user.save();

        // FIXED: Passing updatedUser instead of the stale user variable
        return res.render("user/userProfile", {
            title: "User Profile",
            cssFile: "userProfile.css",
            jsFile: "userProfile.js",
            user: updatedUser,
            success: "Password changed successfully"
        });

    } catch (error) {
        console.log("CHANGE PASSWORD ERROR:", error);
        return res.redirect("/profile/user");
    }
};
export default {
    getForgotPassword,
    postForgotPassword,
    getResetPassword,
    postResetPassword,
    changePassword, 
}
