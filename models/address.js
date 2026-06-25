import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        fullName: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        addressLine: {
            type: String,
            required: true
        },

        landmark: {
            type: String
        },

        city: {
            type: String,
            required: true
        },

        state: {
            type: String,
            required: true
        },

        pincode: {
            type: String,
            required: true
        },

        addressType: {
            type: String,
            enum: ["Home", "Office"],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Address", addressSchema);