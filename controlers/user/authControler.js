import express from 'express'
import User from "../../models/User.js";
import bcrypt from "bcrypt";
import AuthService from "../../services/authService.js";
import {
    clearUserSessionCookie,
    createUserSession,
    destroySession
} from "../../utils/sessionUtils.js";
// GET LOGIN
const getUserLogin = (req, res) => {
    try {

        if (req.session.user) {
            return res.redirect("/home");
        }

        return res.render("user/loginAndSignup", {
            title: "Signin",
            cssFile: "loginAndSignup.css",
            jsFile: "signupAuth.js",
            error: null,
            success: null,
            isSignup: false
        });

    } catch (error) {

        console.log("GET USER LOGIN ERROR:", error);

        return res.redirect("/");
    }
};



// GET SIGNUP
const getUserSignup = (req, res, next) => {
    try {
        // Safe check: Ensures req.session exists before looking for 'user'
        if (req.session?.user) {
            return res.redirect("/home");
        }

        return res.render("user/loginAndSignup", {
            title: "Signup",
            cssFile: "loginAndSignup.css",
            jsFile: "signupAuth.js",
            error: null,
            success: null,
            isSignup: true
        });
    } catch (error) {
        // Log the actual error for debugging purposes
        console.error("Error in getUserSignup controller:", error);
        
        // Pass the error to Express's central error-handling middleware
        next(error);
    }
};
// POST SIGNUP
const postUserSignup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;

        if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "All fields are required", success: null, isSignup: true
            });
        }

        if (password !== confirmPassword) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Passwords do not match", success: null, isSignup: true
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await AuthService.checkExistingUser(normalizedEmail);
        if (existingUser) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Email already exists", success: null, isSignup: true
            });
        }

        const hashedPassword = await AuthService.hashUserPassword(password);
        const otp = AuthService.generateOtp();

        req.session.userData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            password: hashedPassword 
        };

        req.session.userOtp = otp;
        req.session.otpExpires = Date.now() + 2 * 60 * 1000; 

        req.session.save(async (err) => {
            if (err) {
                return res.render("user/loginAndSignup", {
                    title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                    error: "Session error", success: null, isSignup: true
                });
            }

            try {
                // FIXED: Direct call via our AuthService instance
                await AuthService.sendVerificationEmail(normalizedEmail, otp);
                return res.redirect("/verify-otp");

            } catch (emailErr) {
                console.error("EMAIL ERROR:", emailErr);
                return res.render("user/loginAndSignup", {
                    title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                    error: "OTP email failed. Please try again.", success: null, isSignup: true
                });
            }
        });

    } catch (error) {
        console.error("Signup error:", error);
        return res.render("user/loginAndSignup", {
            title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
            error: "An unexpected error occurred", success: null, isSignup: true
        });
    }
};


// POST LOGIN
const postUserLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Invalid Email or Password", success: null, isSignup: false
            });
        }

        if (user.isBlocked) {
            await cleanupSessionSafely(req, res, "Blocked user login");
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Your account has been blocked by an admin", success: null, isSignup: false
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Invalid Email or Password", success: null, isSignup: false
            });
        }

        try {
            await createUserSession(req, user);
        } catch (sessionError) {
            console.error("User login session error:", sessionError);
            return res.render("user/loginAndSignup", {
                title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
                error: "Session Error", success: null, isSignup: false
            });
        }

        return res.redirect("/home");

    } catch (error) {
        console.error(error);
        return res.render("user/loginAndSignup", {
            title: "Signup", cssFile: "loginAndSignup.css", jsFile: "signupAuth.js",
            error: "Login Failed", success: null, isSignup: false
        });
    }
};
// LOGOUT
const postUserLogout = async (req, res, next) => {
    try {
        await destroySession(req);
        clearUserSessionCookie(res);
        return res.redirect("/");
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in postUserLogout controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
    }
};



export default {

getUserLogin,
getUserSignup,
postUserSignup,
postUserLogin,
postUserLogout

}