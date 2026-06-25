import Address from "../../models/address.js";

// ADDRESS PAGE
const getAddressPage = async (req, res) => {
    try {
        // Fallback to safely catch standard MongoDB _id or id
        const userId = req.session?.user?._id || req.session?.user?.id;

        const addresses = await Address.find({ userId });

        return res.render("user/address", {
            title: "Saved Address",
            cssFile: "address.css",
            user: req.session?.user,
            addresses
        });

    } catch (error) {
        console.log(error);
        return res.redirect("/user-profile");
    }
};


// GET ADD ADDRESS PAGE
const getAddAddressPage = (req, res) => {
    try {
        return res.render("user/addAddress", {
            title: "Add Address",
            cssFile: "addAddress.css",
            jsFile: "addAddress.js",
            user: req.session?.user,
            error: null
        });

    } catch (error) {
        console.error("getAddAddressPage error:", error);
        return res.redirect("/user-profile");
    }
};


// ADD ADDRESS
const addAddress = async (req, res) => {
    try {
        // Fix 1: Ensure we grab the valid database identifier
        const userId = req.session?.user?._id || req.session?.user?.id;

        const {
            fullName,
            phone,
            house,
            area,
            landmark,
            city,
            state,
            pincode,
            addressType
        } = req.body;

        // NORMALIZATION
        const addressLine = `${house.trim().toLowerCase()}, ${area.trim().toLowerCase()}`;
        const cityNorm = city.trim().toLowerCase();
        const pincodeNorm = pincode.trim();
        const phoneNorm = phone.toString().trim();

        // Fix 2: Reliable Duplicate Check 
        // Checks if this specific user has already saved this exact physical location
        const existing = await Address.findOne({
            userId,
            addressLine,
            pincode: pincodeNorm
        });

        if (existing) {
            return res.render("user/addAddress", {
                title: "Add Address",
                cssFile: "addAddress.css",
                jsFile: "addAddress.js",
                user: req.session?.user,
                error: "Address already exists"
            });
        }

        // CREATE ADDRESS
        await Address.create({
            userId,
            fullName: fullName.trim(),
            phone: phoneNorm,
            addressLine,
            landmark: landmark?.trim() || "",
            city: cityNorm,
            state: state.trim(),
            pincode: pincodeNorm,
            addressType
        });

        req.flash("success", "Address added successfully");
        return res.redirect("/address");

    } catch (error) {
        console.log("ADD ADDRESS ERROR:", error);
        // Fix 3: Corrected fallback redirect to match your addressRoutes.js configuration
        return res.redirect("/address/new");
    }
};


// GET EDIT ADDRESS PAGE
const getEditAddress = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.redirect("/address");
        }

        return res.render("user/editAddress", {
            title: "Edit Address",
            cssFile: "addAddress.css",
            jsFile: "editAddress.js",
            user: req.session?.user,
            address
        });

    } catch (error) {
        console.log(error);
        return res.redirect("/address");
    }
};


// UPDATE ADDRESS
const updateAddress = async (req, res) => {
    try {
        const {
            fullName,
            phone,
            house,
            area,
            landmark,
            city,
            state,
            pincode,
            addressType
        } = req.body;

        const addressLine = `${house.trim().toLowerCase()}, ${area.trim().toLowerCase()}`;
        const cityNorm = city.trim().toLowerCase();

        await Address.findByIdAndUpdate(req.params.id, {
            fullName: fullName.trim(),
            phone: phone.toString().trim(),
            addressLine,
            landmark: landmark?.trim() || "",
            city: cityNorm,
            state: state.trim(),
            pincode: pincode.trim(),
            addressType
        });

        return res.redirect("/address");

    } catch (error) {
        console.log(error);
        return res.redirect("/address");
    }
};


// DELETE ADDRESS
const deleteAddress = async (req, res) => {
    try {
        await Address.findByIdAndDelete(req.params.id);
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