const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../../model/user.model');
 
async function registerUser({ name, email, password, role = "user" }) {
    const existing = await UserModel.findOne({ $or: [{ name }, { email }] });
    if (existing) {
        const err = new Error("User already exists");
        err.status = 409;
        throw err;
    }
 
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email, password: passwordHash, role });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
 
    return { user, token };
}
 
async function loginUser({ name, email, password }) {
    const user = await UserModel.findOne({ $or: [{ name }, { email }] });
    if (!user) {
        const err = new Error("User not found");
        err.status = 401;
        throw err;
    }
 
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        const err = new Error("Invalid password");
        err.status = 401;
        throw err;
    }
 
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    return { user, token };
}
 
module.exports = { registerUser, loginUser };