const musicModel = require("../../model/music.model");
const { generateTagsForSong, MOOD_TAGS } = require("./gemini.service");
const { uploadFile } = require("./storage.service");
 
function parseTags(rawTags) {
    if (!rawTags) return [];
    return rawTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => MOOD_TAGS.includes(t));
}
 
// Upload a song. If the artist typed tags, use those (filtered against our
// fixed vocabulary). Otherwise, ask Gemini to auto-tag it from the title.
async function createSong({ title, rawTags, file, artistId }) {
    const result = await uploadFile(file.buffer.toString("base64"));
 
    let tags = parseTags(rawTags);
    if (tags.length === 0) {
        try {
            tags = await generateTagsForSong(title);
        } catch (err) {
            console.log("Gemini auto-tagging failed:", err.message);
            tags = [];
        }
    }
    if (tags.length === 0) {
            const lowerTitle = title.toLowerCase();
            tags = MOOD_TAGS.filter((tag) => lowerTitle.includes(tag));
        }
 
    return musicModel.create({ url: result.url, title, artist: artistId, tags });
}
 
async function findSongsByArtist(artistId) {
    return musicModel.find({ artist: artistId }).sort({ _id: -1 });
}
 
module.exports = { createSong, findSongsByArtist, parseTags };