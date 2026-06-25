import express from "express"
import {blockUser,unblockUser,getUserDashboard} from "../../controlers/admin/userManagementController.js";
import {
    disableCache,
    isAuthenticated
} from "../../middleware/authMiddleware.js";

const router = express.Router();
router.patch(
    "/user/:id/block",
    disableCache,
    isAuthenticated,
    blockUser
);

router.patch(
    "/user/:id/unblock",
    disableCache,
    isAuthenticated,
    unblockUser
);

router.get(
    "/users",
    disableCache,
    isAuthenticated,
    getUserDashboard
);

export default router;