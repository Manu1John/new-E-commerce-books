import Address from "../../models/address.js";


 export const  getAddressPageService= async({userId})=>{
    const address = await Address.find({userId})
    return address
}
export const addAddressService = async(userId,addressData)=>{
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
        } = addressData
        // NORMALIZATION
        const addressLine = `${house.trim().toLowerCase()}, ${area.trim().toLowerCase()}`;
        const cityNorm = city.trim().toLowerCase();
        const pincodeNorm = pincode.trim();
        const phoneNorm = phone.toString().trim();
        // Reliable Duplicate Check (Includes City)
            const existingAddress = await Address.findOne({
            userId,
            addressLine,
            city: cityNorm,
            pincode: pincodeNorm
        });
        // CREATE ADDRESS
      const newAddress =  await Address.create({
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
    return{
        existingAddress,
        newAddress
    }

}

export const getEditAddressService = async(addressId)=>{

    const updateAddress = await Address.findById(addressId)

    return updateAddress

}

export const updateAddressService = async (userId, addressId, addressData) => {
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
    } = addressData;

    // NORMALIZATION
    const addressLine = `${house.trim().toLowerCase()}, ${area.trim().toLowerCase()}`;
    const cityNorm = city.trim().toLowerCase();
    const pincodeNorm = pincode.trim();
    const phoneNorm = phone.toString().trim();

    // FIXED: Duplicate check now excludes the CURRENT address ID (addressId), not the userId
    const existingAddress = await Address.findOne({
        userId,
        _id: { $ne: addressId }, 
        addressLine,
        city: cityNorm,
        pincode: pincodeNorm
    });

    // If a duplicate exists, return early so we don't unnecessarily update the database
    if (existingAddress) {
        return { existingAddress, updateAddress: null };
    }

    // FIXED: Find and update by addressId, not userId
    const updateAddress = await Address.findByIdAndUpdate(
        addressId, 
        {
            fullName: fullName.trim(),
            phone: phoneNorm,
            addressLine,
            landmark: landmark?.trim() || "",
            city: cityNorm,
            state: state.trim(),
            pincode: pincodeNorm,
            addressType
        },
        { new: true } // Added to ensure Mongoose returns the newly updated document
    );

    return {
        existingAddress: null,
        updateAddress
    };
};

export const deleteAddressService = async(addressId)=>{
    return await Address.findByIdAndDelete(addressId)
}