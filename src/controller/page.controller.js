const albumModel = require("../model/album.model");
const authService = require("./services/auth.service");
const musicService = require("./services/music.service");
const { searchAll, searchByMood } = require("./services/search.service");
 
function showLogin(req, res) {
    res.render("login", { error: req.query.error || null });
}
 
async function handleLogin(req, res) {
    const { name, password } = req.body;
    try {
        const { token } = await authService.loginUser({ name, email: name, password });
        res.cookie("token", token);
        res.redirect("/dashboard");
    } catch (err) {
        res.redirect("/login?error=" + encodeURIComponent(err.message));
    }
}
 
function showRegister(req, res) {
    res.render("register", { error: req.query.error || null });
}
 
async function handleRegister(req, res) {
    const { name, email, password, role } = req.body;
    try {
        const { token } = await authService.registerUser({
            name,
            email,
            password,
            role: role === "artist" ? "artist" : "user"
        });
        res.cookie("token", token);
        res.redirect("/dashboard");
    } catch (err) {
        res.redirect("/register?error=" + encodeURIComponent(err.message));
    }
}
 
function handleLogout(req, res) {
    res.clearCookie("token");
    res.redirect("/login");
}
 
// The one and only page after login. Handles: the unified search box, the
// mood search box, and (for artists) the upload-song / create-album forms.
async function showDashboard(req, res) {
    const { q, feeling } = req.query;
 
    let mode = null;
    let songResults = [];
    let albumResults = [];
    let tagsUsed = [];
 
    if (feeling) {
        mode = "mood";
        const result = await searchByMood(feeling);
        songResults = result.songs;
        tagsUsed = result.tagsUsed;
    } else if (q) {
        mode = "text";
        const result = await searchAll(q);
        songResults = result.songs;
        albumResults = result.albums;
    }
 
    let mySongs = [];
    let myAlbums = [];
    if (req.user.role === "artist") {
        mySongs = await musicService.findSongsByArtist(req.user.id);
        myAlbums = await albumModel.find({ artist: req.user.id }).populate("musics", "title");
    }
 
    res.render("dashboard", {
        currentUser: req.user,
        q: q || "",
        feeling: feeling || "",
        mode,
        songResults,
        albumResults,
        tagsUsed,
        mySongs,
        myAlbums,
        error: req.query.error || null,
        success: req.query.success || null
    });
}
 
async function handleUpload(req, res) {
    try {
        const { title, tags } = req.body;
        const file = req.file;
 
        if (!file) {
            throw Object.assign(new Error("Please choose an audio file"), { status: 400 });
        }
 
        await musicService.createSong({ title, rawTags: tags, file, artistId: req.user.id });
        res.redirect("/dashboard?success=" + encodeURIComponent("Song uploaded"));
    } catch (err) {
        res.redirect("/dashboard?error=" + encodeURIComponent(err.message));
    }
}
 
async function handleCreateAlbum(req, res) {
    try {
        const { title, musics } = req.body;
        const musicIds = Array.isArray(musics) ? musics : (musics ? [musics] : []);
 
        if (musicIds.length === 0) {
            throw Object.assign(new Error("Pick at least one song"), { status: 400 });
        }
 
        await albumModel.create({ title, musics: musicIds, artist: req.user.id });
        res.redirect("/dashboard?success=" + encodeURIComponent("Album created"));
    } catch (err) {
        res.redirect("/dashboard?error=" + encodeURIComponent(err.message));
    }
}
 
module.exports = {
    showLogin, handleLogin,
    showRegister, handleRegister,
    handleLogout,
    showDashboard, handleUpload, handleCreateAlbum
};