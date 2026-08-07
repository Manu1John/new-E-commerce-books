
import {getUserDashboardService,blockUserService,
    unblockUserService} from '../../services/admin/userService.js'
/* ---------------- DASHBOARD ---------------- */
export const getUserDashboard =
async (req, res) => {
    try {
        const page =parseInt(req.query.page) || 1;
        const search =(req.query.search) || "";
        const limit = Number(req.query.limit)||5;
        const {users,totalPages,totalUsers} 
        = await getUserDashboardService(page,limit,search) 
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
                search,
                limit,
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
        const userId =req.params.id;
        await blockUserService(userId)
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
        const userId =req.params.id;
        await unblockUserService(userId)
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