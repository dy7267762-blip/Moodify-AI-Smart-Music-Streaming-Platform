const musicModel = require("../model/music.model");
const albumModel = require("../model/album.model");
const musicService = require("./services/music.service");
const { searchAll, searchByMood } = require("./services/search.service");
 
async function createMusic(req, res) {
    const { title } = req.body;
    const file = req.file;
 
    const music = await musicService.createSong({
        title,
        rawTags: req.body.tags,
        file,
        artistId: req.user.id
    });
 
    res.status(201).json({
        message: "music created successfully",
        music: {
            id: music._id,
            title: music.title,
            url: music.url,
            artist: music.artist,
            tags: music.tags
        }
    });
}
 
async function createAlbum(req, res) {
    const { musics, title } = req.body;
 
    const album = await albumModel.create({
        title: title,
        musics: musics,
        artist: req.user.id
    });
 
    return res.status(201).json({
        message: "album created successfully",
        album: {
            id: album._id,
            artist: album.artist,
            title: album.title,
            musics: album.musics
        }
    });
}
 
async function getAllMusics(req, res) {
    const musics = await musicModel.find().limit(5).populate("artist", "name email");
 
    res.status(200).json({
        message: "music fetched successfully",
        musics: musics
    });
}
 
async function getAllAlbums(req, res) {
    const albums = await albumModel.find().select("title artist").populate("artist", "name email");
 
    res.status(200).json({
        message: "all albums are here",
        albums: albums
    });
}
 
async function getAlbumById(req, res) {
    const albumId = req.params.albumId;
    const album = await albumModel.findById(albumId).populate("artist", "name email").populate("musics");
 
    return res.status(200).json({
        message: "album with music fetched successfully",
        album: album
    });
}
 
// One search endpoint, matching songs, artists, and albums together.
async function searchMusic(req, res) {
    const { q } = req.query;
    const { songs, albums } = await searchAll(q);
 
    res.status(200).json({
        message: "search results",
        query: q || "",
        songs,
        albums
    });
}

async function searchMoodMusic(req, res) {
    const { feeling } = req.query;
    const { tagsUsed, songs } = await searchByMood(feeling);
 
    res.status(200).json({
        message: "mood search results",
        feeling: feeling || "",
        tagsUsed,
        songs
    });
}
 
module.exports = {
    createMusic, createAlbum,
    getAllMusics, getAllAlbums, getAlbumById,
    searchMusic, searchMoodMusic
};