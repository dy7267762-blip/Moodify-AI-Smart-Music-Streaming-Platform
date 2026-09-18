const mongoose=require("mongoose");
 
const UserSchema= new mongoose.Schema({
    name:{
        type:String,
        unique:true,
        required:true,
    },
    email:{
        type:String,
        unique:true,
        required:true,
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["user", "artist"],
        required:true
    }
 
});
 
const UserModel= mongoose.model("user", UserSchema);
 
module.exports=UserModel;
 