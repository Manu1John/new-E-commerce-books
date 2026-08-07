import User from '../../models/User.js'

export async function getUserDashboardService(page,limit,search){
    const skip = (page-1)*limit
    const filter = {
        $or:[
            {
            firstName:{
                    $regex:search,
                    $options:"i"
            }
        },
        {
            lastName:{
                $regex:"$options",
                $options:"i"
            }
        },
        {
            email:{
                $regex:search,
                $options:"i"
            }

        }
        ] 
    }
    const totalUsers = await User.countDocuments(filter)
    const users= await User.find(filter)
    .sort({updatedAt:-1})
    .skip(skip)
    .limit(limit)
    const totalPages = Math.ceil(totalUsers/limit)
    return{
        users,
        totalPages,
        totalUsers
    }
} 

export async function blockUserService(userId){
    return await User.findByIdAndUpdate(userId,{isBlocked:true})
}

export async function unblockUserService(userId){
    return await User.findByIdAndUpdate(userId,{isBlocked:false})
}
