import express from 'express'
import AuthService from "../../services/authService.js";
import User from "../../models/User.js";
import bcrypt from "bcrypt";
import {
    clearUserSessionCookie,
    createUserSession,
    destroySession
} from "../../utils/sessionUtils.js";


// GET VERIFY OTP PAGE
const getVerifyOtp = (req, res, next) => {
    try {
        // Safe check: Using optional chaining (?.) prevents crashes if the session is uninitialized
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
        // Log the error for server-side debugging
        console.error("Error in getVerifyOtp controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
    }
};


// VERIFY OTP
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

        await User.create({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password
        });

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
        // Safe check: Optional chaining prevents crashes if the session is uninitialized
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
        // Log the error for server-side debugging
        console.error("Error in getForgotOtpPage controller:", error);
        
        // Forward the error to your central Express error-handling middleware
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

        // Generate a new OTP using your central AuthService
        const otp = AuthService.generateOtp();

        // Update session with new OTP and extend the 2-minute expiration window
        req.session.forgotOtp = otp;
        req.session.forgotOtpExpires = Date.now() + 2 * 60 * 1000; 

        // Force save session before sending the email to avoid race conditions
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Send the new OTP using your Brevo service
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
// RESEND OTP  
const resendOtp = async (req, res) => {
    try {
        const userData = req.session.userData;

        if (!userData?.email) {
            return res.redirect("/");
        }

        // FIXED: Using central generateOtp tool
        const otp = AuthService.generateOtp();

        req.session.userOtp = otp;
        req.session.otpExpires = Date.now() + 2 * 60 * 1000; 

        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // FIXED: Passing parameters into the central AuthService flow
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

        const userId =
            req.session.user.id;

        const { newEmail } =
            req.body;

        const user =
            await User.findById(userId);

        if (!user) {
            return res.redirect(
                "/user-profile"
            );
        }

        // check empty
        if (!newEmail?.trim()) {

            return res.render(
                "user/userProfile",
                {
                    title:
                        "User Profile",

                    cssFile:
                        "userProfile.css",

                    jsFile:
                        "userProfile.js",

                    user,

                    emailError:
                        "Please enter email"
                }
            );
        }

        const normalizedEmail =
            newEmail
                .trim()
                .toLowerCase();

        // prevent same email
        if (
            normalizedEmail ===
            user.email
        ) {

            return res.render(
                "user/userProfile",
                {
                    title:
                        "User Profile",

                    cssFile:
                        "userProfile.css",

                    jsFile:
                        "userProfile.js",

                    user,

                    emailError:
                        "New email cannot be same as current email"
                }
            );
        }

        // check existing user
        const existingUser =
            await User.findOne({
                email:
                    normalizedEmail
            });

        if (existingUser) {

            return res.render(
                "user/userProfile",
                {
                    title:
                        "User Profile",

                    cssFile:
                        "userProfile.css",

                    jsFile:
                        "userProfile.js",

                    user,

                    emailError:
                        "Email already exists"
                }
            );
        }

        // generate OTP
        const otp =
            AuthService.generateOtp();

        // session store
        req.session.emailOtp =
            otp;

        req.session.newEmail =
            normalizedEmail;

        req.session.emailOtpExpire =
            Date.now() +
            2 * 60 * 1000;

        // send OTP
        await AuthService
            .sendVerificationEmail(
                normalizedEmail,
                otp
            );

        return res.render(
            "user/userProfile",
            {
                title:
                    "User Profile",

                cssFile:
                    "userProfile.css",

                jsFile:
                    "userProfile.js",

                user,

                emailSuccess:
                    "OTP sent to your email"
            }
        );

    } catch (error) {

        console.log(
            "SEND EMAIL OTP ERROR:",
            error
        );

        return res.redirect(
            "/user-profile"
        );
    }
};

// VERIFY EMAIL OTP
const verifyEmailOtp =
async (req, res) => {

    try {

        const userId =
            req.session.user.id;

        const { otp } =
            req.body;

        const user =
            await User.findById(
                userId
            );

        if (!user) {

            return res.redirect(
                "/user-profile"
            );
        }

        // expiry check
        if (
            !req.session
                .emailOtpExpire ||

            Date.now() >
            req.session
                .emailOtpExpire
        ) {

            return res.render(
                "user/userProfile",
                {
                    title:
                        "User Profile",

                    cssFile:
                        "userProfile.css",

                    jsFile:
                        "userProfile.js",

                    user,

                    emailError:
                        "OTP expired"
                }
            );
        }

        // OTP check
        if (
            String(otp).trim()
            !==
            String(
                req.session
                    .emailOtp
            ).trim()
        ) {

            return res.render(
                "user/userProfile",
                {
                    title:
                        "User Profile",

                    cssFile:
                        "userProfile.css",

                    jsFile:
                        "userProfile.js",

                    user,

                    emailError:
                        "Invalid OTP"
                }
            );
        }

        // update email
        await User
            .findByIdAndUpdate(
                userId,
                {
                    email:
                        req.session
                            .newEmail
                }
            );

        // update session email
        req.session.user.email =
            req.session
                .newEmail;

        // clear session
        delete req.session.emailOtp;
        delete req.session.newEmail;
        delete req.session
            .emailOtpExpire;

        const updatedUser =
            await User.findById(
                userId
            );

        return res.render(
            "user/userProfile",
            {
                title:
                    "User Profile",

                cssFile:
                    "userProfile.css",

                jsFile:
                    "userProfile.js",

                user:
                    updatedUser,

                emailSuccess:
                    "Email updated successfully"
            }
        );

    } catch (error) {

        console.log(
            "VERIFY EMAIL OTP ERROR:",
            error
        );

        return res.redirect(
            "/user-profile"
        );
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
verifyEmailOtp
}