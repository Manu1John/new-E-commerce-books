
import express from 'express'
import User from "../../models/User.js";
import {getUserProfileService,
    updateUserProfileService
} from "../../services/user/profileService.js"
const getUserProfile = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/");
        }
        // Safely extract the ID depending on how you structured your session data
        const userId = req.session.user._id || req.session.user.id || req.session.user;
        const result = await getUserProfileService(userId);
        // If the session exists but the user was deleted from the database
        if (!result || !result.user) {
            req.session.destroy(); // Clear the invalid session
            return res.redirect("/");
        }
        
        const { user, booksOrdered, wishlistItems, reviewsPosted } = result;
        
        return res.render(
            "user/userProfile",
            {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile:"userProfile.js",
                user,
                booksOrdered,
                wishlistItems,
                reviewsPosted
            }
        );

    } catch (error) {
        console.log("GET USER PROFILE ERROR:", error);
        return res.redirect("/");
    }
};

const updateUserProfile =
async (req, res) => {
    try {
        const userId =
        req.session.user.id;
        const {
            firstName,
            lastName,
            phone
        } = req.body;
        // image upload
        if (req.file) {
            req.body.profileImage =
                "/uploads/" +
                req.file.filename;
        }
        await updateUserProfileService(req.body,userId)

        return res.redirect(
            "/profile/user"
        );
    } catch (error) {
        console.log(error);
        return res.redirect(
            "/profile/user"
        );
    }
};
export default {
    getUserProfile,
    updateUserProfile
}