import AuthService from "../../services/user/authService.js";
import {
    createVerifiedUserService,
    validateNewEmailService,
    updateEmailAndFetchUserService
} from "../../services/user/otpService.js";
import { getUserProfileService } from "../../services/user/profileService.js";
import User from "../../models/User.js";
import bcrypt from "bcrypt";

// GET VERIFY OTP PAGE
const getVerifyOtp = (req, res, next) => {
    try {
        if (!req.session?.userOtp || !req.session?.userData) {
            return res.redirect("/");
        }

        return res.render("user/verifyOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: null,
            success: null
        });
    } catch (error) {
        console.error("Error in getVerifyOtp controller:", error);
        next(error);
    }
};

// VERIFY OTP (Registration)
const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!req.session.userOtp || !req.session.userData) {
            return res.redirect("/login");
        }

        if (!req.session.otpExpires || Date.now() > req.session.otpExpires) {
            return res.render("user/verifyOtp", {
                title: "Verify OTP",
                cssFile: "verifyOtp.css",
                jsFile: "verifyOtp.js",
                error: "OTP has expired. Please resend a new one.",
                success: null
            });
        }

        const enteredOtp = String(otp).trim();
        const storedOtp = String(req.session.userOtp).trim();

        if (enteredOtp !== storedOtp) {
            return res.render("user/verifyOtp", {
                title: "Verify OTP",
                cssFile: "verifyOtp.css",
                jsFile: "verifyOtp.js",
                error: "Invalid OTP",
                success: null
            });
        }

        const userData = req.session.userData;
        if (!userData?.email || !userData?.password) {
            return res.redirect("/login");
        }

        // Call Service to create user
        await createVerifiedUserService(userData);

        // Clear OTP-related session data
        delete req.session.userOtp;
        delete req.session.userData;
        delete req.session.otpExpires;

        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        return res.redirect("/login");
    } catch (err) {
        console.error("OTP VERIFY ERROR:", err);
        return res.render("user/verifyOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: "Something went wrong during verification. Try again.",
            success: null
        });
    }
};

// GET FORGOT OTP PAGE
const getForgotOtpPage = (req, res, next) => {
    try {
        if (!req.session?.forgotOtp) {
            return res.redirect("/forgot-password");
        }

        return res.render("user/verifyForgotOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: null,
            success: null
        });
    } catch (error) {
        console.error("Error in getForgotOtpPage controller:", error);
        next(error);
    }
};

// VERIFY FORGOT OTP
const verifyForgotOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!req.session.forgotOtp) {
            return res.redirect("/forgot-password");
        }

        if (Date.now() > req.session.forgotOtpExpires) {
            return res.render("user/verifyForgotOtp", {
                title: "Verify OTP",
                cssFile: "verifyOtp.css",
                jsFile: "verifyOtp.js",
                error: "OTP expired",
                success: ""
            });
        }

        const enteredOtp = String(otp).trim();
        const storedOtp = String(req.session.forgotOtp).trim();

        if (enteredOtp !== storedOtp) {
            return res.render("user/verifyForgotOtp", {
                title: "Verify OTP",
                cssFile: "verifyOtp.css",
                error: "Invalid OTP",
                success: null
            });
        }

        req.session.otpVerified = true;
        return res.redirect("/reset-password");
    } catch (error) {
        console.error(error);
        return res.redirect("/forgot-password");
    }
};

// RESEND FORGOT PASSWORD OTP  
const resendForgotOtp = async (req, res) => {
    try {
        const email = req.session.forgotEmail;

        if (!email) {
            return res.redirect("/forgot-password");
        }

        const otp = AuthService.generateOtp();

        req.session.forgotOtp = otp;
        req.session.forgotOtpExpires = Date.now() + 2 * 60 * 1000; 

        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await AuthService.sendPasswordResetOtp(email, otp);

        return res.render("user/verifyForgotOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: null,
            success: "A fresh OTP has been sent to your email."
        });
    } catch (error) {
        console.error("RESEND FORGOT OTP ERROR:", error);
        return res.render("user/verifyForgotOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: "Failed to resend OTP. Please try again.",
            success: null
        });
    }
};

// RESEND OTP (Registration)
const resendOtp = async (req, res) => {
    try {
        const userData = req.session.userData;

        if (!userData?.email) {
            return res.redirect("/");
        }

        const otp = AuthService.generateOtp();

        req.session.userOtp = otp;
        req.session.otpExpires = Date.now() + 2 * 60 * 1000; 

        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await AuthService.sendVerificationEmail(userData.email, otp);

        return res.render("user/verifyOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: null,
            success: "A new OTP has been sent to your email."
        });
    } catch (error) {
        console.error("RESEND OTP ERROR:", error?.response?.text || error.message);
        return res.render("user/verifyOtp", {
            title: "Verify OTP",
            cssFile: "verifyOtp.css",
            jsFile: "verifyOtp.js",
            error: "Failed to resend OTP",
            success: null
        });
    }
};

// SEND OTP FOR EMAIL CHANGE
const sendEmailOtp = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { newEmail, password } = req.body;

        // Helper: render userProfile with all required template variables
        const renderProfile = async (userDoc, extras = {}) => {
            const profileData = await getUserProfileService(userId);
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user: userDoc || profileData?.user,
                booksOrdered: profileData?.booksOrdered ?? 0,
                wishlistItems: profileData?.wishlistItems ?? 0,
                reviewsPosted: profileData?.reviewsPosted ?? 0,
                ...extras
            });
        };

        const user = await User.findById(userId);

        if (!user.password) {
            return renderProfile(user, { emailError: "Users registered via Google cannot change their email" });
        }

        if (!newEmail?.trim()) {
            return renderProfile(user, { emailError: "Please enter email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return renderProfile(user, { emailError: "Incorrect password" });
        }

        // Call Service to validate email rules
        const validationResult = await validateNewEmailService(userId, newEmail);

        if (!validationResult.success) {
            if (validationResult.status === "NOT_FOUND") {
                return res.redirect("/user-profile");
            }
            return renderProfile(validationResult.user, { emailError: validationResult.error });
        }

        const otp = AuthService.generateOtp();

        // Session store
        req.session.emailOtp = otp;
        req.session.newEmail = validationResult.normalizedEmail;
        req.session.emailOtpExpire = Date.now() + 2 * 60 * 1000;

        await AuthService.sendVerificationEmail(validationResult.normalizedEmail, otp);

        return renderProfile(validationResult.user, { emailSuccess: "OTP sent to your new email" });

    } catch (error) {
        console.error("SEND EMAIL OTP ERROR:", error);
        return res.redirect("/user-profile");
    }
};

// VERIFY EMAIL OTP
const verifyEmailOtp = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { otp } = req.body;

        // Helper: render userProfile with all required template variables
        const renderProfile = async (userDoc, extras = {}) => {
            const profileData = await getUserProfileService(userId);
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user: userDoc || profileData?.user,
                booksOrdered: profileData?.booksOrdered ?? 0,
                wishlistItems: profileData?.wishlistItems ?? 0,
                reviewsPosted: profileData?.reviewsPosted ?? 0,
                ...extras
            });
        };

        const user = await User.findById(userId);
        if (!user) {
            return res.redirect("/user-profile");
        }

        // Expiry check
        if (!req.session.emailOtpExpire || Date.now() > req.session.emailOtpExpire) {
            return renderProfile(user, { emailError: "OTP expired" });
        }

        // OTP check
        if (String(otp).trim() !== String(req.session.emailOtp).trim()) {
            return renderProfile(user, { emailError: "Invalid OTP" });
        }

        // Call Service to commit the email update
        const updatedUser = await updateEmailAndFetchUserService(userId, req.session.newEmail);

        // Update session email
        req.session.user.email = req.session.newEmail;

        // Clear session
        delete req.session.emailOtp;
        delete req.session.newEmail;
        delete req.session.emailOtpExpire;

        return renderProfile(updatedUser, { emailSuccess: "Email updated successfully" });

    } catch (error) {
        console.error("VERIFY EMAIL OTP ERROR:", error);
        return res.redirect("/user-profile");
    }
};

// RESEND EMAIL OTP
const resendEmailOtp = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const newEmail = req.session.newEmail;

        const renderProfile = async (userDoc, extras = {}) => {
            const { getUserProfileService } = await import("../../services/user/profileService.js");
            const profileData = await getUserProfileService(userId);
            return res.render("user/userProfile", {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile: "userProfile.js",
                user: userDoc || profileData?.user,
                booksOrdered: profileData?.booksOrdered ?? 0,
                wishlistItems: profileData?.wishlistItems ?? 0,
                reviewsPosted: profileData?.reviewsPosted ?? 0,
                ...extras
            });
        };

        const user = await User.findById(userId);

        if (!newEmail) {
            return res.redirect("/user-profile");
        }

        const otp = AuthService.generateOtp();

        req.session.emailOtp = otp;
        req.session.emailOtpExpire = Date.now() + 2 * 60 * 1000;

        await AuthService.sendVerificationEmail(newEmail, otp);

        return renderProfile(user, { emailSuccess: "OTP resent to your new email" });
    } catch (error) {
        console.error("RESEND EMAIL OTP ERROR:", error);
        return res.redirect("/user-profile");
    }
};

export default {
    getVerifyOtp,
    verifyOtp,
    resendOtp,
    getForgotOtpPage,
    verifyForgotOtp,
    resendForgotOtp,
    sendEmailOtp,
    verifyEmailOtp,
    resendEmailOtp
};