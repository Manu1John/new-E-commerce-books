import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
    username :{
        type:String,
        required:true,
        uniquie:true
    },
    password:{
        type:String,
        required:true
    }
},
{
    timestamps: true
})
const Admin = mongoose.model("adminAuthentication",AdminSchema)

export default Admin