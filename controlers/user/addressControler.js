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

        // Reliable Duplicate Check (Includes City)
        const existing = await Address.findOne({
            userId,
            addressLine,
            city: cityNorm,
            pincode: pincodeNorm
        });

        if (existing) {
            return res.render("user/addAddress", {
                title: "Add Address",
                cssFile: "addAddress.css",
                jsFile: "addAddress.js",
                user: req.session?.user,
                error: "This address already exists in your saved addresses."
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

        if (req.flash) req.flash("success", "Address added successfully");
        return res.redirect("/address");

    } catch (error) {
        console.log("ADD ADDRESS ERROR:", error);
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

        // Duplicate check that excludes the CURRENT address ID
        const existing = await Address.findOne({
            userId,
            _id: { $ne: req.params.id }, 
            addressLine,
            city: cityNorm,
            pincode: pincodeNorm
        });

        if (existing) {
            // Re-render the edit page with an error, maintaining the user's input
            return res.render("user/editAddress", {
                title: "Edit Address",
                cssFile: "addAddress.css",
                jsFile: "editAddress.js",
                user: req.session?.user,
                address: { ...req.body, _id: req.params.id }, 
                error: "Another saved address already has these details."
            });
        }

        await Address.findByIdAndUpdate(req.params.id, {
            fullName: fullName.trim(),
            phone: phoneNorm,
            addressLine,
            landmark: landmark?.trim() || "",
            city: cityNorm,
            state: state.trim(),
            pincode: pincodeNorm,
            addressType
        });

        return res.redirect("/address");

    } catch (error) {
        console.log("UPDATE ADDRESS ERROR:", error);
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