import User from "../../models/user.js";

export const getUserProfileService= async(userId)=>{
    const user = await  User.findById(userId)
    return user
}

export const updateUserProfileService = async(userData,userId)=>{
           const {
                firstName,
                lastName,
                phone
            } = userData;
      const updateData = {
            firstName,
            lastName,
            phone
        };
    return  await User.findByIdAndUpdate(
            userId,
            updateData
        );
}


