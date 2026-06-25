import flash from "connect-flash";
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import session from 'express-session';
import passport from './config/passport.js'
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


// 🚨 console.log(process.env.BREVO_API_KEY) has been REMOVED for security.
// 🧹 Unused middleware imports were removed from here.

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// static files
app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// initalize DB
connectDB();

// routes
app.use(methodOverride("_method"));
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


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server started! http://localhost:${PORT}`);
});
