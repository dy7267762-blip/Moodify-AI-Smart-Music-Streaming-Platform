
const express = require("express");
const multer = require("multer");
const pageController = require("../controller/page.controller");
const authMiddleware = require("../middlewares/auth.middleware");
 
const upload = multer({ storage: multer.memoryStorage() });
 
const router = express.Router();
 
router.get("/", (req, res) => res.redirect(req.user ? "/dashboard" : "/login"));
 
router.get("/login", pageController.showLogin);
router.post("/login", pageController.handleLogin);
 
router.get("/register", pageController.showRegister);
router.post("/register", pageController.handleRegister);
 
router.post("/logout", pageController.handleLogout);
 
// Everything below requires login.
router.get("/dashboard", authMiddleware.requireLoginPage, pageController.showDashboard);
router.post("/dashboard/upload", authMiddleware.requireArtistPage, upload.single("music"), pageController.handleUpload);
router.post("/dashboard/album", authMiddleware.requireArtistPage, pageController.handleCreateAlbum);
 
module.exports = router;