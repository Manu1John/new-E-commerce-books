import User from "../../models/User.js";

// Create a new user after successful registration OTP verification
export const createVerifiedUserService = async (userData) => {
    return await User.create({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password
    });
};

// Validate the requested new email for profile updates
export const validateNewEmailService = async (userId, newEmail) => {
    const user = await User.findById(userId);
    if (!user) {
        return { success: false, status: "NOT_FOUND" };
    }

    const normalizedEmail = newEmail.trim().toLowerCase();

    // Prevent changing to the same email
    if (normalizedEmail === user.email) {
        return { 
            success: false, 
            status: "SAME_EMAIL", 
            error: "New email cannot be same as current email", 
            user 
        };
    }

    // Check if the new email is already in use by another account
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        return { 
            success: false, 
            status: "EMAIL_EXISTS", 
            error: "Email already exists", 
            user 
        };
    }

    return { success: true, user, normalizedEmail };
};

// Update the user's email after successful OTP verification
export const updateEmailAndFetchUserService = async (userId, newEmail) => {
    await User.findByIdAndUpdate(userId, { email: newEmail });
    return await User.findById(userId);
};