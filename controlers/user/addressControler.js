
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
        const {existingAddress,newAddress} = 
        await addAddressService(userId,req.body)
        if (existingAddress) {
            return res.render("user/addAddress", {
                title: "Add Address",
                cssFile: "addAddress.css",
                jsFile: "addAddress.js",
                user: req.session?.user,
                error: "This address already exists in your saved addresses."
            });
        }
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
        const addressId = req.params.id
        const updateAddress = await getEditAddressService(addressId)
        if (!updateAddress) {
            return res.redirect("/address");
        }

        return res.render("user/editAddress", {
            title: "Edit Address",
            cssFile: "addAddress.css",
            jsFile: "editAddress.js",
            user: req.session?.user,
            address:updateAddress
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
        
        // Extract the address ID from the URL parameters
        const addressId = req.params.id; 

        // FIXED: Pass addressId to the service
        const { existingAddress, updateAddress } = await updateAddressService(userId, addressId, req.body);
        
        if (existingAddress) {
            // Re-render the edit page with an error, maintaining the user's input
            return res.render("user/editAddress", {
                title: "Edit Address",
                cssFile: "addAddress.css",
                jsFile: "editAddress.js",
                user: req.session?.user,
                address: { ...req.body, _id: addressId }, 
                error: "Another saved address already has these details."
            });
        }

        return res.redirect("/address");

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