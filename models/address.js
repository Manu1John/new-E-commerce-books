import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserAuthentication",
            required: true
        },

        isDefault: {
            type: Boolean,
            default: false
        },

        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            minlength: [3, 'Name must be at least 3 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
            match: [/^[A-Za-z\s]+$/, 'Name can only contain letters and spaces'],
            trim: true
        },

        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            match: [/^[1-9][0-9]{9}$/, 'Phone number must be exactly 10 digits and cannot start with 0'],
            trim: true
        },

        addressLine: {
            type: String,
            required: [true, 'Address line is required'],
            match: [/^[A-Za-z0-9\s,\-]+$/, 'Address can only contain letters, numbers, spaces, commas, and hyphens'],
            trim: true
        },

        landmark: {
            type: String,
            match: [/^[A-Za-z0-9\s,\-]*$/, 'Landmark can only contain letters, numbers, spaces, commas, and hyphens'],
            trim: true
        },

        city: {
            type: String,
            required: [true, 'City is required'],
            match: [/^[A-Za-z\s]+$/, 'City can only contain letters and spaces'],
            trim: true
        },

        state: {
            type: String,
            required: [true, 'State is required'],
            match: [/^[A-Za-z\s]+$/, 'State can only contain letters and spaces'],
            trim: true
        },

        pincode: {
            type: String,
            required: [true, 'Pincode is required'],
            match: [/^[1-9][0-9]{5}$/, 'Pincode must be exactly 6 digits and cannot start with 0'],
            trim: true
        },

        addressType: {
            type: String,
            enum: {
                values: ["Home", "Office"],
                message: '{VALUE} is not a valid address type'
            },
            required: true
        }
    },
    {
        timestamps: true
    }
);
const Address = mongoose.model("Address", addressSchema);
export default Address