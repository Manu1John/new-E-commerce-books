import AuthService from "../../services/user/authService.js";
import {
    findUserByEmailService,
    resetUserPasswordService,
    changeUserPasswordService
} from "../../services/user/passwordService.js";
import { getUserProfileService } from "../../services/user/profileService.js";

// GET FORGOT PASSWORD
const getForgotPassword = (req, res, next) => {
    try {
        return res.render("user/forgotPassword", {
            title: "Forgot Password",
            cssFile: "loginAndSignup.css",
            error: null,
            success: null
        });
    } catch (error) {
        console.error("Error in getForgotPassword controller:", error);
        next(error);
    }
};

// POST FORGOT PASSWORD
const postForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Delegate DB query to the service
        const user = await findUserByEmailService(email);

        if (!user) {
            return res.render("user/forgotPassword", {
                title: "Forgot Password",
                cssFile: "loginAndSignup.css",
                error: "Email not found",
                success: null
            });
        }

        const otp = AuthService.generateOtp();

        req.session.forgotEmail = user.email;
        req.session.forgotOtp = otp;
        req.session.forgotOtpExpires = Date.now() + 2 * 60 * 1000;

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
        if (!req.session?.otpVerified) {
            return res.redirect("/forgot-password");
        }

        return res.render("user/resetPassword", {
            title: "Reset Password",
            cssFile: "loginAndSignup.css",
            error: null
        });
    } catch (error) {
        console.error("Error in getResetPassword controller:", error);
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
        
        // Delegate hashing and DB update to the service
        const updatedUser = await resetUserPasswordService(email, password);

        if (!updatedUser) {
            return res.redirect("/forgot-password");
        }

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

// POST CHANGE PASSWORD (Authenticated Profile)
const changePassword = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Helper to render profile with all required template variables
        const renderProfile = async (userOverride, extras = {}) => {
            // getUserProfileService returns { user, booksOrdered, wishlistItems, reviewsPosted }
            const profileData = await getUserProfileService(userId);
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user: userOverride || profileData?.user,
                booksOrdered: profileData?.booksOrdered ?? 0,
                wishlistItems: profileData?.wishlistItems ?? 0,
                reviewsPosted: profileData?.reviewsPosted ?? 0,
                ...extras
            });
        };

        if (newPassword !== confirmPassword) {
            return renderProfile(null, { error: "Passwords do not match" });
        }

        // Delegate all verification and DB update logic to the service
        const result = await changeUserPasswordService(userId, currentPassword, newPassword);

        if (!result.success) {
            if (result.status === "NOT_FOUND") {
                return res.redirect("/profile/user");
            }
            return renderProfile(result.user, { error: result.error });
        }

        return renderProfile(result.user, { success: "Password changed successfully" });

    } catch (error) {
        console.error("CHANGE PASSWORD ERROR:", error);
        return res.redirect("/profile/user");
    }
};

export default {
    getForgotPassword,
    postForgotPassword,
    getResetPassword,
    postResetPassword,
    changePassword, 
};