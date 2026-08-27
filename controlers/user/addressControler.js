
import {getAddressPageService,
    addAddressService,getEditAddressService,
    updateAddressService,deleteAddressService
} from "../../services/user/addressService.js" 

// Helper function for strict server-side validation
const validateAddressInput = (data) => {
    const errors = [];
    
    // Check missing or whitespace only
    const requiredFields = ["fullName", "phone", "house", "area", "city", "state", "pincode", "addressType"];
    for (const field of requiredFields) {
        if (!data[field] || !String(data[field]).trim()) {
            errors.push(`${field} cannot be empty or just spaces.`);
        }
    }
    
    if (errors.length) return errors; // Return early if missing fields

    const fullName = String(data.fullName).trim();
    if (fullName.length < 3 || fullName.length > 50) errors.push("Name must be between 3 and 50 characters.");
    if (!/^[A-Za-z\s]+$/.test(fullName)) errors.push("Name can only contain letters and spaces.");

    const phone = String(data.phone).trim();
    if (!/^[0-9]{10}$/.test(phone)) errors.push("Phone number must be exactly 10 digits.");
    if (/^0{10}$/.test(phone)) errors.push("Phone number cannot be all zeros.");

    const pincode = String(data.pincode).trim();
    if (!/^[0-9]{6}$/.test(pincode)) errors.push("Pincode must be exactly 6 digits.");
    if (/^0{6}$/.test(pincode)) errors.push("Pincode cannot be all zeros.");

    const city = String(data.city).trim();
    if (!/^[A-Za-z\s]+$/.test(city)) errors.push("City cannot contain numbers or special characters.");

    const state = String(data.state).trim();
    if (!/^[A-Za-z\s]+$/.test(state)) errors.push("State cannot contain numbers or special characters.");

    // XSS Prevention & basic character matching for addresses
    const xssPattern = /<[^>]*>?/gm;
    const addressPattern = /^[A-Za-z0-9\s,\-]+$/;

    const house = String(data.house).trim();
    if (xssPattern.test(house) || !addressPattern.test(house)) errors.push("House/Building contains invalid characters.");

    const area = String(data.area).trim();
    if (xssPattern.test(area) || !addressPattern.test(area)) errors.push("Area/Street contains invalid characters.");

    const landmark = data.landmark ? String(data.landmark).trim() : "";
    if (landmark && (xssPattern.test(landmark) || !/^[A-Za-z0-9\s,\-]*$/.test(landmark))) {
        errors.push("Landmark contains invalid characters.");
    }

    const addressType = String(data.addressType).trim();
    if (!["Home", "Work", "Office"].includes(addressType)) {
        errors.push("Address type must be 'Home' or 'Work'.");
    }

    return errors;
};

// ADDRESS PAGE
const getAddressPage = async (req, res) => {
    try {
        // Fallback to safely catch standard MongoDB _id or id
        const userId = req.session?.user?._id || req.session?.user?.id;
        const address = await getAddressPageService({userId})

        return res.render("user/address", {
            title: "Saved Address",
            cssFile: "address.css",
            user: req.session?.user,
            address
        });

    } catch (error) {
        console.log(error);
        return res.redirect("/user-profile");
    }
};
// GET ADD ADDRESS PAGE
// GET ADD ADDRESS PAGE
const getAddAddressPage = (req, res) => {
    try {
        const returnTo = req.query.returnTo; // Capture the flag
        return res.render("user/addAddress", {
            title: "Add Address",
            cssFile: "addAddress.css",
            jsFile: "addAddress.js",
            user: req.session?.user,
            error: null,
            returnTo // Pass it to EJS
        });
    } catch (error) {
        console.error("getAddAddressPage error:", error);
        return res.redirect("/user-profile");
    }
};

// ADD ADDRESS
const addAddress = async (req, res) => {
    try {
        const userId = req.session?.user?._id || req.session?.user?.id;
        const returnTo = req.query.returnTo; // Capture the flag
        const redirectUrl = returnTo === 'checkout' ? '/checkout' : '/address'; // Determine routing
        const wantsJson = req.xhr || req.headers.accept?.includes("application/json") || req.headers["content-type"]?.includes("application/json");

        const validationErrors = validateAddressInput(req.body);
        if (validationErrors.length > 0) {
            if (wantsJson) {
                return res.status(400).json({ success: false, error: validationErrors.join(" | ") });
            }
            return res.render("user/addAddress", {
                title: "Add Address",
                cssFile: "addAddress.css",
                jsFile: "addAddress.js",
                user: req.session?.user,
                error: validationErrors[0],
                returnTo
            });
        }

        const {existingAddress,newAddress} = await addAddressService(userId,req.body);
        
        if (existingAddress) {
            if (wantsJson) {
                return res.status(409).json({
                    success: false,
                    error: "This address already exists in your saved addresses."
                });
            }
            return res.render("user/addAddress", {
                title: "Add Address",
                cssFile: "addAddress.css",
                jsFile: "addAddress.js",
                user: req.session?.user,
                error: "This address already exists in your saved addresses.",
                returnTo // Maintain flag on error
            });
        }
        if (req.flash) req.flash("success", "Address added successfully");
        if (wantsJson) {
            return res.status(201).json({
                success: true,
                message: "Address added successfully",
                address: newAddress
            });
        }
        
        // Redirect dynamically
        return res.redirect(redirectUrl);

    } catch (error) {
        console.log("ADD ADDRESS ERROR:", error);
        const wantsJson = req.xhr || req.headers.accept?.includes("application/json") || req.headers["content-type"]?.includes("application/json");
        if (wantsJson) return res.status(500).json({ success: false, error: "Failed to save address." });
        return res.redirect("/address/new");
    }
};

// GET EDIT ADDRESS PAGE
const getEditAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const returnTo = req.query.returnTo; // Capture the flag
        const updateAddress = await getEditAddressService(addressId);
        
        const wantsJson = req.xhr || req.headers.accept?.includes("application/json");

        if (!updateAddress) {
            if (wantsJson) return res.status(404).json({ success: false, error: "Address not found" });
            return res.redirect("/address");
        }

        if (wantsJson) {
            return res.status(200).json({ success: true, address: updateAddress });
        }

        return res.render("user/editAddress", {
            title: "Edit Address",
            cssFile: "addAddress.css",
            jsFile: "editAddress.js",
            user: req.session?.user,
            address:updateAddress,
            returnTo // Pass it to EJS
        });

    } catch (error) {
        console.log(error);
        const wantsJson = req.xhr || req.headers.accept?.includes("application/json");
        if (wantsJson) return res.status(500).json({ success: false, error: "Server Error" });
        return res.redirect("/address");
    }
};

// UPDATE ADDRESS
const updateAddress = async (req, res) => {
    try {
        const userId = req.session?.user?._id || req.session?.user?.id;
        const addressId = req.params.id; 
        const returnTo = req.query.returnTo; // Capture the flag
        const redirectUrl = returnTo === 'checkout' ? '/checkout' : '/address'; // Determine routing
        const wantsJson = req.xhr || req.headers.accept?.includes("application/json") || req.headers["content-type"]?.includes("application/json");

        const validationErrors = validateAddressInput(req.body);
        if (validationErrors.length > 0) {
            if (wantsJson) return res.status(400).json({ success: false, error: validationErrors.join(" | ") });
            return res.render("user/editAddress", {
                title: "Edit Address",
                cssFile: "addAddress.css",
                jsFile: "editAddress.js",
                user: req.session?.user,
                address: { ...req.body, _id: addressId }, 
                error: validationErrors[0],
                returnTo
            });
        }

        const { existingAddress, updateAddress } = await updateAddressService(userId, addressId, req.body);
        
        if (existingAddress) {
            if (wantsJson) return res.status(409).json({ success: false, error: "Another saved address already has these details." });
            return res.render("user/editAddress", {
                title: "Edit Address",
                cssFile: "addAddress.css",
                jsFile: "editAddress.js",
                user: req.session?.user,
                address: { ...req.body, _id: addressId }, 
                error: "Another saved address already has these details.",
                returnTo // Maintain flag on error
            });
        }

        if (wantsJson) {
            return res.status(200).json({
                success: true,
                message: "Address updated successfully",
                address: updateAddress
            });
        }

        // Redirect dynamically
        return res.redirect(redirectUrl);

    } catch (error) {
        console.error("UPDATE ADDRESS ERROR:", error);
        const wantsJson = req.xhr || req.headers.accept?.includes("application/json") || req.headers["content-type"]?.includes("application/json");
        if (wantsJson) return res.status(500).json({ success: false, error: "Failed to update address." });
        return res.redirect("/address");
    }
};

// DELETE ADDRESS
const deleteAddress = async (req, res) => {
    try {
        const addressId =req.params.id
        await deleteAddressService(addressId)
        return res.redirect("/address");

    } catch (error) {
        console.log(error);
        return res.redirect("/address");
    }
};

export default {
    getAddAddressPage,
    getAddressPage,
    addAddress,
    updateAddress,
    getEditAddress,
    deleteAddress
};
