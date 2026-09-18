const jwt = require('jsonwebtoken')
 
// --- API middleware (used by /api/... routes) - responds with JSON 401/403 ---
 
async function authArtist(req, res, next) {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ message: "login first!" })
    }
 
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded.role != "artist") {
            return res.status(403).json({ message: "You are not authorised for this action" })
        }
        req.user = decoded;
        next()
    } catch (err) {
        return res.status(401).json({ message: "unverified account" })
    }
}
 
async function authUser(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "First Login" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next()
    } catch (err) {
        return res.status(401).json({ message: "unverified account" })
    }
}
 
// --- Page middleware (used by the EJS routes) - redirects instead of JSON ---
 
// Attaches req.user (and res.locals.currentUser for templates) if a valid
// cookie is present, without rejecting the request. Every page route after
// this can check req.user itself and redirect to /login if it's missing.
async function attachUser(req, res, next) {
    const token = req.cookies.token;
 
    if (!token) {
        req.user = null;
        res.locals.currentUser = null;
        return next();
    }
 
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        res.locals.currentUser = decoded;
    } catch (err) {
        req.user = null;
        res.locals.currentUser = null;
    }
 
    next();
}
 
function requireLoginPage(req, res, next) {
    if (!req.user) {
        return res.redirect('/login');
    }
    next();
}
 
function requireArtistPage(req, res, next) {
    if (!req.user) {
        return res.redirect('/login');
    }
    if (req.user.role !== 'artist') {
        return res.redirect('/dashboard?error=' + encodeURIComponent('Only artist accounts can do that'));
    }
    next();
}
 
module.exports = { authArtist, authUser, attachUser, requireLoginPage, requireArtistPage };