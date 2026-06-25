import User from "../../models/User.js";



/* ---------------- DASHBOARD ---------------- */
export const getUserDashboard =
async (req, res) => {
    try {

        const page =
            parseInt(
                req.query.page
            ) || 1;

        const search =
            req.query.search || "";

        const limit = 5;

        const skip =
            (page - 1) * limit;

        const filter = {
            $or: [
                {
                    firstName: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    lastName: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ]
        };

        const totalUsers =
            await User.countDocuments(
                filter
            );

        const users =
            await User.find(filter)
                .sort({
                    updatedAt: -1
                })
                .skip(skip)
                .limit(limit);

        const totalPages =
            Math.ceil(
                totalUsers / limit
            );

        return res.render(
            "admin/users",
            {
                title:
                    "User Management ",
                cssFile:
                    "users.css",
                jsFile:
                    "users.js",
                users,
                currentPage:
                    page,
                totalPages,
                totalUsers,
                search
            }
        );

    } catch (error) {
        console.log(
            "getDashboard error:",
            error
        );

        return res
            .status(500)
            .send(
                "Something went wrong"
            );
    }
};

/* ---------------- BLOCK USER ---------------- */

export const blockUser =
async (req, res) => {
    try {

        const userId =
            req.params.id;

        await User.findByIdAndUpdate(
            userId,
            {
                isBlocked: true
            }
        );

        return res.redirect(
            "/admin/users"
        );

    } catch (error) {

        console.log(
            "BLOCK USER ERROR:",
            error
        );

        return res.redirect(
            "/admin/dashboard"
        );
    }
};

/* ---------------- UNBLOCK USER ---------------- */

export const unblockUser =
async (req, res) => {
    try {

        const userId =
            req.params.id;

        await User.findByIdAndUpdate(
            userId,
            {
                isBlocked: false
            }
        );

        return res.redirect(
            "/admin/users"
        );

    } catch (error) {

        console.log(
            "UNBLOCK USER ERROR:",
            error
        );

        return res.redirect(
            "/admin/users"
        );
    }
};