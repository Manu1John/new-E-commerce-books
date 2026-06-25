import User from "../models/User.js";
import {
    clearUserSessionCookie,
    destroySession,
    refreshUserSession
} from "../utils/sessionUtils.js";

const clearInvalidUserSession = async (req, res) => {
    try {
        await destroySession(req);
    } catch (error) {
        console.error("User session cleanup error:", error);
    }

    clearUserSessionCookie(res);
    return res.redirect("/");
};

// authentication middleware
const isAuthenticated = (req, res, next) => {

    if (req.session?.admin) {
        return next();
    }

    return res.redirect('/admin/login');
};

// User Auth Middleware
// USER AUTH
const authenticatedUser =
async (
    req,
    res,
    next
) => {

    try {

        if (!req.session?.user?.id) {
            return res.redirect("/");
        }

        // get fresh user data
        const user =
        await User.findById(
            req.session.user.id
        );

        // user deleted
        if (!user) {
            return clearInvalidUserSession(req, res);
        }

        // USER BLOCKED
        if (user.isBlocked) {
            return clearInvalidUserSession(req, res);
        }

        refreshUserSession(req, user);
        req.user = user;
        res.locals.user = req.session.user;

        next();

    } catch (error) {

        console.log(error);

        return clearInvalidUserSession(req, res);
    }
};

// disable browser cache
const disableCache = (
    req,
    res,
    next
) => {

    res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
    );

    res.set(
        "Pragma",
        "no-cache"
    );

    res.set(
        "Expires",
        "0"
    );

    next();
};

 const markAuthFlowPage = (req, res, next) => {
    res.locals.authFlowGuard = true;
    res.locals.noStorePage = true;
    next();
};

 const redirectLoggedInUser = (req, res, next) => {
    if (req.session?.user) {
        return res.redirect("/home");
    }

    next();
};
const markAdminAuthPage = (req, res, next) => {
    if (
        req.method === "GET" &&
        req.path === "/login"
    ) {
        res.locals.authFlowGuard = true;
        res.locals.noStorePage = true;
    }

    next();
}

export {
    isAuthenticated,
    authenticatedUser,
    disableCache,
    markAuthFlowPage,
    redirectLoggedInUser,
    markAdminAuthPage
    
};

