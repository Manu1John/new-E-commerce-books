import crypto from "crypto";
import User from "../models/User.js";
import bcrypt from "bcrypt";
// Notice the name change here! It is now sendEmail instead of sendOtpEmail
import sendEmail from "../config/brevo.js"; 

class AuthService {
    // Check if the email is already in use
    static async checkExistingUser(email) {
        return await User.findOne({ email });
    }

    // Hash the password
    static async hashUserPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    // Generate a 6-digit OTP (You already have this one!)
    static generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Trigger the Brevo email for Signup Verification
    static async sendVerificationEmail(email, otp) {
        const subject = "Your Account Verification OTP";
        const htmlContent = `
            <h2>Welcome!</h2>
            <p>Your verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in a few minutes.</p>
        `;
        return await sendEmail(email, subject, htmlContent);
    }

    // NEW: Send the password reset OTP
    static async sendPasswordResetOtp(email, otp) {
        const subject = "Password Reset OTP";
        const htmlContent = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset. Your OTP is: <strong>${otp}</strong></p>
            <p>This OTP will expire in 2 minutes.</p>
        `;
        return await sendEmail(email, subject, htmlContent); 
    }
} // End of class

export default AuthService;