import User from "../../models/User.js";
import AuthService from "../../services/user/authService.js";
import bcrypt from "bcrypt";

// Check if a user exists by their email
export const findUserByEmailService = async (email) => {
    return await User.findOne({
        email: email.trim().toLowerCase()
    });
};

// Handle hashing and saving the new password for a forgot-password reset
export const resetUserPasswordService = async (email, newPassword) => {
    const user = await User.findOne({ email });
    if (!user) return null;

    const hashedPassword = await AuthService.hashUserPassword(newPassword);
    user.password = hashedPassword;
    
    return await user.save();
};

// Handle business logic for an authenticated user changing their password
export const changeUserPasswordService = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId);

    if (!user) {
        return { success: false, status: "NOT_FOUND" };
    }

    // Current password check
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return { 
            success: false, 
            error: "Current password is incorrect", 
            user 
        };
    }

    // Validate password complexity requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return { 
            success: false, 
            error: "Password must contain 8+ characters, uppercase, lowercase, number and special character", 
            user 
        };
    }

    // Prevent same password
    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
        return { 
            success: false, 
            error: "New password cannot be same as old password", 
            user 
        };
    }

    // Hash password manually and save
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    const updatedUser = await user.save();
    return { success: true, user: updatedUser };
};