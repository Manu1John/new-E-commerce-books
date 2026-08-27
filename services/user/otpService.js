import User from "../../models/User.js";
import Wallet from "../../models/Wallet.js";
import Offer from "../../models/Offer.js";
import crypto from "crypto";

// Create a new user after successful registration OTP verification
export const createVerifiedUserService = async (userData) => {
    const newUserConfig = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        referralCode: crypto.randomBytes(4).toString('hex').toUpperCase()
    };

    let referrer = null;
    if (userData.referralCode) {
        // Referral codes are stored in uppercase, so convert input to uppercase to ensure match
        const uppercaseReferral = userData.referralCode.toUpperCase();
        referrer = await User.findOne({ referralCode: uppercaseReferral });
        if (referrer) {
            newUserConfig.referredBy = referrer._id;
        }
    }

    const newUser = await User.create(newUserConfig);

    // Determine bonus amount from active referral offer (if referrer exists)
    let bonusAmount = 0;
    if (referrer) {
        const activeReferralOffer = await Offer.findOne({ 
            type: 'referral', 
            isActive: true, 
            isDeleted: false,
            startDate: { $lte: new Date() },
            expiryDate: { $gt: new Date() }
        });
        if (activeReferralOffer) {
            bonusAmount = activeReferralOffer.discountPercentage || 0;
        }
    }

    // Always create a wallet for every new user and link it
    const newUserWallet = await Wallet.create({
        user: newUser._id,
        balance: bonusAmount,
        transactions: bonusAmount > 0
            ? [{ type: 'credit', amount: bonusAmount, description: 'Signup Referral Bonus' }]
            : []
    });

    // Link the wallet ObjectId back to the user document
    newUser.wallet = newUserWallet._id;
    await newUser.save();

    // Credit the referrer's wallet if a bonus applies
    if (referrer && bonusAmount > 0) {
        let referrerWallet = await Wallet.findOne({ user: referrer._id });
        if (!referrerWallet) {
            // Create referrer's wallet if it doesn't exist and link it
            referrerWallet = await Wallet.create({
                user: referrer._id,
                balance: bonusAmount,
                transactions: [{ type: 'credit', amount: bonusAmount, description: 'Referral Bonus' }]
            });
            await User.findByIdAndUpdate(referrer._id, { wallet: referrerWallet._id });
        } else {
            referrerWallet.balance += bonusAmount;
            referrerWallet.transactions.push({ type: 'credit', amount: bonusAmount, description: 'Referral Bonus' });
            await referrerWallet.save();
        }
    }

    return newUser;
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