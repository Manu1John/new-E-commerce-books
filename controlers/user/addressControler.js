
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

        const {existingAddress,newAddress} = await addAddressService(userId,req.body);
        
        if (existingAddress) {
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
        
        // Redirect dynamically
        return res.redirect(redirectUrl);

    } catch (error) {
        console.log("ADD ADDRESS ERROR:", error);
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