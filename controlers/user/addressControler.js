
import {getAddressPageService,
    addAddressService,getEditAddressService,
    updateAddressService,deleteAddressService
} from "../../services/user/addressService.js" 

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

        const requiredFields = ["fullName", "phone", "house", "area", "city", "state", "pincode", "addressType"];
        const missingFields = requiredFields.filter((field) => !req.body?.[field] || !String(req.body[field]).trim());
        if (missingFields.length) {
            if (wantsJson) {
                return res.status(400).json({
                    success: false,
                    error: `Missing required fields: ${missingFields.join(", ")}`
                });
            }
            return res.render("user/addAddress", {
                title: "Add Address",
                cssFile: "addAddress.css",
                jsFile: "addAddress.js",
                user: req.session?.user,
                error: "Please fill all required address fields.",
                returnTo
            });
        }

        if (!/^[6-9]\d{9}$/.test(String(req.body.phone).trim())) {
            if (wantsJson) return res.status(400).json({ success: false, error: "Enter a valid 10 digit phone number." });
        }

        if (!/^\d{6}$/.test(String(req.body.pincode).trim())) {
            if (wantsJson) return res.status(400).json({ success: false, error: "Enter a valid 6 digit pincode." });
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
        
        if (!updateAddress) {
            return res.redirect("/address");
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

        const { existingAddress, updateAddress } = await updateAddressService(userId, addressId, req.body);
        
        if (existingAddress) {
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

        // Redirect dynamically
        return res.redirect(redirectUrl);

    } catch (error) {
        console.error("UPDATE ADDRESS ERROR:", error);
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
