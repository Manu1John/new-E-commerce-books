
import express from 'express'
import User from "../../models/User.js";

const getUserProfile = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect("/");
        }

        // get full user data from database
        const user = await User.findById(
            req.session.user.id
        );

        return res.render(
            "user/userProfile",
            {
                title: "User Profile",
                cssFile: "userProfile.css",
                jsFile:"userProfile.js",
                user
            }
        );

    } catch (error) {

        console.log(error);

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

        const updateData = {

            firstName,
            lastName,
            phone
        };

        // image upload
        if (req.file) {

            updateData.profileImage =
                "/uploads/" +
                req.file.filename;
        }

        await User.findByIdAndUpdate(
            userId,
            updateData
        );

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