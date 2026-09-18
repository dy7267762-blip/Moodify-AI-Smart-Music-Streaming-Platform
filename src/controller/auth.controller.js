const authService = require('./services/auth.service');
 
async function registerUser(req,res){
    const {name,email,password,role="user"}=req.body;
 
    try {
        const { user, token } = await authService.registerUser({ name, email, password, role });
 
        res.cookie("token", token);
        res.status(201).json({
            message:"User registered successfully",
            user:{id:user._id, name:user.name, email:user.email, role:user.role}
        });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
}
 
async function loginUser(req,res){
    const{name,email,password}=req.body;
 
    try {
        const { user, token } = await authService.loginUser({ name, email, password });
 
        res.cookie("token", token);
        res.status(200).json({
            msg:"you logged in",
            user:{
                id:user.id,
                name:user.name,
                email:user.email,
                role:user.role
            }
        })
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
}
 
async function logoutUser(req,res){
    res.clearCookie("token")
    res.status(200).json("you have successfully logged out")
}
 
module.exports={registerUser, loginUser, logoutUser};