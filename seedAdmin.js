import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import Admin from "./models/Admin.js";

dotenv.config();

const seedAdmin = async () => {

    try {

        await mongoose.connect(
            process.env.MONGO_URI
        );

        const username =
            "admin";

        const plainPassword =
            "Admin@123";

        // check existing admin
        const existingAdmin =
            await Admin.findOne({
                username
            });

        if (
            existingAdmin
        ) {

            console.log(
                "Admin already exists"
            );

            process.exit();
        }

        // hash password
        const hashedPassword =
            await bcrypt.hash(
                plainPassword,
                10
            );

        // create admin
        await Admin.create({
            username,
            password:
                hashedPassword
        });

        console.log(
            "Admin created successfully"
        );

        console.log(
            "Username:",
            username
        );

        console.log(
            "Password:",
            plainPassword
        );

        process.exit();

    } catch (error) {

        console.log(error);

        process.exit(1);
    }
};

seedAdmin();