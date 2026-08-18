import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        // 🛠️ Made optional because some Google profiles don't have a last name
        required: false, 
    },
    password: {
        type: String,
        // 🛠️ Removed required: true so Google SSO users can register passwordless
        required: false, 
    },
    email: {
        type: String,
        required: true,
        unique: true
    },


    isBlocked: {
        type: Boolean,
        default: false
    },
    googleId: { 
        type: String 
    },
    // Inside models/User.js (Ensure this field exists in your schema)
facebookId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple users to not have a facebookId
},
// Add inside your User schema:
resetPasswordToken: {
    type: String,
    default: null
},
resetPasswordExpires: {
    type: Date,
    default: null
},
    phone: {
        type: String,
        default: ""
    },

    profileImage: {
        type: String,
        default: ""
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet"
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAuthentication"
    }
},
{
    timestamps: true
});



// This checks if the model already exists in memory before compiling it again
const UserAuthentication = mongoose.models
.UserAuthentication || mongoose.model("UserAuthentication", userSchema);

export default UserAuthentication;