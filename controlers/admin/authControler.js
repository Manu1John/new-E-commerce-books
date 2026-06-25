import {
    clearAdminSessionCookie,
    createAdminSession,
    destroySession
} from "../../utils/sessionUtils.js";
import Admin from '../../models/Admin.js'
import bcrypt from "bcrypt"


/* ---------------- ADMIN LOGIN PAGE ---------------- */

export const getAdminLogin = (req, res) => {
    try {
        if (req.session.admin) {
            return res.redirect("/admin/users");
        }

        return res.render("admin/login", {
            title: "admin login",
            cssFile: "adminlogin.css",
            jsFile: "adminlogin.js",
            useBootstrap: true
        });

    } catch (error) {
        console.log("getAdminLogin error:", error);

        return res
            .status(500)
            .send("Internal Server Error");
    }
};

/* ---------------- ADMIN LOGIN POST ---------------- */
export const postAdminLogin =
async (req, res) => {

    try {

        const {
            username,
            password
        } = req.body;

        // Empty field check
        if (
            !username ||
            !password
        ) {

            return res.render(
                "admin/login",
                {
                    title:
                        "admin login",

                    cssFile:
                        "adminlogin.css",

                    jsFile:
                        "adminlogin.js",

                    useBootstrap:
                        true,

                    error:
                        "Username and password required"
                }
            );
        }

        // Find admin in DB
        const admin =
            await Admin.findOne({
                username
            });

        // Admin not found
        if (!admin) {

            return res.render(
                "admin/login",
                {
                    title:
                        "admin login",

                    cssFile:
                        "adminlogin.css",

                    jsFile:
                        "adminlogin.js",

                    useBootstrap:
                        true,

                    error:
                        "Invalid username or password"
                }
            );
        }

        // Compare password
        const isPasswordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );

        if (!isPasswordMatch) {

            return res.render(
                "admin/login",
                {
                    title:
                        "admin login",

                    cssFile:
                        "adminlogin.css",

                    jsFile:
                        "adminlogin.js",

                    useBootstrap:
                        true,

                    error:
                        "Invalid username or password"
                }
            );
        }

        // Create session
        await createAdminSession(
            req,
            admin.username
        );

        return res.redirect(
            "/admin/users"
        );

    } catch (error) {

        console.log(
            "postAdminLogin error:",
            error
        );

        return res
            .status(500)
            .send(
                "Internal Server Error"
            );
    }
};
/* ---------------- LOGOUT ---------------- */

export const postAdminLogout =
async (req, res) => {
    try {
        await destroySession(req);

        clearAdminSessionCookie(res);

        return res.redirect(
            "/admin/login"
        );

    } catch (error) {
        console.log(
            "ADMIN LOGOUT ERROR:",
            error
        );

        return res
            .status(500)
            .send("Logout failed");
    }
};