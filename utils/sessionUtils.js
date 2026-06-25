const ONE_HOUR = 1000 * 60 * 60;
const isProduction = process.env.NODE_ENV === "production";

export const USER_SESSION_COOKIE_NAME = "user.sid";
export const ADMIN_SESSION_COOKIE_NAME = "admin.sid";

if (isProduction && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required when NODE_ENV is production.");
}

const sessionSecret =
    process.env.SESSION_SECRET
    || "development-only-session-secret";

const baseCookieOptions = {
    maxAge: ONE_HOUR,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax"
};

const createSessionConfig = (name, path = "/") => ({
    name,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        ...baseCookieOptions,
        path
    }
});

const createClearCookieOptions = (path = "/") => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path
});

export const userSessionConfig =
    createSessionConfig(USER_SESSION_COOKIE_NAME);

export const adminSessionConfig =
    createSessionConfig(ADMIN_SESSION_COOKIE_NAME, "/admin");

export const sessionConfig = userSessionConfig;

const getSessionUser = (user) => ({
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName || "",
    isBlocked: Boolean(user.isBlocked)
});

const regenerateSession = (req) => new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
        if (error) {
            reject(error);
            return;
        }

        resolve();
    });
});

const saveSession = (req) => new Promise((resolve, reject) => {
    req.session.save((error) => {
        if (error) {
            reject(error);
            return;
        }

        resolve();
    });
});

export const createUserSession = async (req, user) => {
    await regenerateSession(req);
    req.session.user = getSessionUser(user);
    await saveSession(req);
};

export const createAdminSession = async (req, username) => {
    await regenerateSession(req);
    req.session.admin = { username };
    await saveSession(req);
};

export const refreshUserSession = (req, user) => {
    req.session.user = getSessionUser(user);
};

export const destroySession = (req) => new Promise((resolve, reject) => {
    if (!req.session) {
        resolve();
        return;
    }

    req.session.destroy((error) => {
        if (error) {
            reject(error);
            return;
        }

        resolve();
    });
});

export const clearUserSessionCookie = (res) => {
    res.clearCookie(
        USER_SESSION_COOKIE_NAME,
        createClearCookieOptions()
    );
};

export const clearAdminSessionCookie = (res) => {
    res.clearCookie(
        ADMIN_SESSION_COOKIE_NAME,
        createClearCookieOptions("/admin")
    );
};

export const clearSessionCookie = clearUserSessionCookie;
