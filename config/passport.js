import "dotenv/config";
import passport from "passport";

import {
    Strategy as GoogleStrategy
} from "passport-google-oauth20";

import {
    Strategy as FacebookStrategy
} from "passport-facebook";

import User from "../models/User.js";


// ================= GOOGLE STRATEGY =================

passport.use(

    new GoogleStrategy(

        {
            clientID:
                process.env
                    .GOOGLE_CLIENT_ID,

            clientSecret:
                process.env
                    .GOOGLE_CLIENT_SECRET,

            callbackURL:
                process.env
                    .GOOGLE_CALLBACK_URL
        },

        async (
            accessToken,
            refreshToken,
            profile,
            done
        ) => {

            try {

                const email =
                    profile
                        .emails?.[0]
                        ?.value
                        ?.trim()
                        ?.toLowerCase();

                let user =
                    await User.findOne({
                        email
                    });

                // Existing User
                if (user) {

                    // Link googleId
                    if (!user.googleId) {

                        user.googleId =
                            profile.id;

                        await user.save();
                    }

                    return done(
                        null,
                        user
                    );
                }

                // Create new user
                const newUser =
                    await User.create({

                        googleId:
                            profile.id,

                        firstName:
                            profile.name
                                .givenName,

                        lastName:
                            profile.name
                                .familyName
                            || "",

                        email
                    });

                return done(
                    null,
                    newUser
                );

            } catch (error) {

                console.error(
                    "Google Auth Error:",
                    error
                );

                return done(
                    error,
                    null
                );
            }
        }
    )
);


// ================= FACEBOOK STRATEGY =================

passport.use(

    new FacebookStrategy(

        {
            clientID:
                process.env
                    .FACEBOOK_APP_ID,

            clientSecret:
                process.env
                    .FACEBOOK_APP_SECRET,

            callbackURL:
                process.env
                    .FACEBOOK_CALLBACK_URL,

            profileFields: [
                "id",
                "name",
                "emails"
            ]
        },

        async (
            accessToken,
            refreshToken,
            profile,
            done
        ) => {

            try {

                const email =
                    profile
                        .emails?.[0]
                        ?.value
                        ?.trim()
                        ?.toLowerCase()
                    || null;

                // Email required
                if (!email) {

                    return done(
                        new Error(
                            "Facebook account must have verified email."
                        ),
                        null
                    );
                }

                let user =
                    await User.findOne({
                        email
                    });

                // Existing user
                if (user) {

                    // Link Facebook ID
                    if (
                        !user.facebookId
                    ) {

                        user.facebookId =
                            profile.id;

                        await user.save();
                    }

                    return done(
                        null,
                        user
                    );
                }

                // Create new user
                const newUser =
                    await User.create({

                        facebookId:
                            profile.id,

                        firstName:
                            profile.name
                                .givenName
                            || "",

                        lastName:
                            profile.name
                                .familyName
                            || "",

                        email
                    });

                return done(
                    null,
                    newUser
                );

            } catch (error) {

                console.error(
                    "Facebook Auth Error:",
                    error
                );

                return done(
                    error,
                    null
                );
            }
        }
    )
);

export default passport;