import dotenv from 'dotenv';
dotenv.config();
import passport from './config/passport.js'
import flash from "connect-flash";
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';


import adminRoutes from './routes/admin/index.js';
import userRoutes from './routes/user/index.js';
import connectDB from './config/db.js';
import {
    adminSessionConfig,
    userSessionConfig
} from './utils/sessionUtils.js';

import methodOverride from "method-override";
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// 🚨 console.log(process.env.BREVO_API_KEY) has been REMOVED for security.
// 🧹 Unused middleware imports were removed from here.

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);

    // Security headers
    app.use(helmet({
        contentSecurityPolicy: false, // Disabling CSP by default to avoid breaking external scripts/styles
    }));

    // Compress responses
    app.use(compression());

    // HTTP request logging
    app.use(morgan('combined'));

    // Global Rate Limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per 15 minutes
        message: "Too many requests from this IP, please try again after 15 minutes"
    });
    app.use(limiter);
}

// body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



// static files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === "production" ? '1d' : 0
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: process.env.NODE_ENV === "production" ? '30d' : 0
}));
// views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// initalize DB
connectDB();

// routes
app.use(methodOverride("_method"));
// Mark all admin requests so the user navbar is suppressed
app.use('/admin', (req, res, next) => { res.locals.isAdmin = true; next(); });
app.use('/admin', session(adminSessionConfig), adminRoutes);
app.use(session(userSessionConfig));
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});


app.use(passport.initialize());
app.use("/", userRoutes);

// 404 Error Handler
app.use((req, res, next) => {
    res.status(404).render("404", { title: "404 Not Found" });
});

// 500 Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);

    const statusCode = err.statusCode || 500;

    // Check if the request expects JSON or is an AJAX request
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json')) || req.is('json')) {
        return res.status(statusCode).json({
            success: false,
            message: err.message || "Internal server error",
            error: process.env.NODE_ENV === "development" ? err.stack : undefined
        });
    }

    res.status(statusCode).render("500", {
        title: "500 Server Error",
        error: process.env.NODE_ENV === "development" ? err : {}
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server started! http://localhost:${PORT}`);
});
