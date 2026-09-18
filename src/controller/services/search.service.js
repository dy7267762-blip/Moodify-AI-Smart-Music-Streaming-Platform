const musicModel = require("../../model/music.model");
const albumModel = require("../../model/album.model");
const userModel = require("../../model/user.model");
const { extractMoodTagsFromFeeling, MOOD_TAGS } = require("./gemini.service");
 
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
 
// ONE search box, matching songs, artists, and albums together - not three
// separate searches. A song matches if its own title matches, OR its artist's
// name matches. Same idea for albums. That's why we look up matching artist
// ids first, then reuse them for both the song query and the album query.
async function searchAll(query) {
    if (!query || !query.trim()) {
        return { songs: [], albums: [] };
    }
 
    const regex = new RegExp(escapeRegex(query.trim()), "i");
 
    const matchingArtists = await userModel.find({ name: regex }).select("_id");
    const artistIds = matchingArtists.map((a) => a._id);
 
    const songs = await musicModel
        .find({ $or: [{ title: regex }, { artist: { $in: artistIds } }] })
        .populate("artist", "name email");
 
    const albums = await albumModel
        .find({ $or: [{ title: regex }, { artist: { $in: artistIds } }] })
        .populate("artist", "name email")
        .populate("musics", "title");
 
    return { songs, albums };
}
 
// Mood/feeling search: Gemini turns free text into tags from our fixed
// vocabulary, then a plain MongoDB $in query filters songs by those tags.
// Falls back to a simple keyword match if the Gemini call fails, so this
// never hard-errors even if the API key/quota has a problem.
async function searchByMood(feelingText) {
    if (!feelingText || !feelingText.trim()) {
        return { tagsUsed: [], songs: [] };
    }
 
    let tagsUsed = [];
    try {
        tagsUsed = await extractMoodTagsFromFeeling(feelingText);
    } catch (err) {
        console.log("Gemini mood extraction failed, falling back:", err.message);
    }
 
    if (tagsUsed.length === 0) {
        const lowerText = feelingText.toLowerCase();
        tagsUsed = MOOD_TAGS.filter((tag) => lowerText.includes(tag));
    }
 
    if (tagsUsed.length === 0) {
        return { tagsUsed: [], songs: [] };
    }
 
    const songs = await musicModel
        .find({ tags: { $in: tagsUsed } })
        .populate("artist", "name email");
 
    return { tagsUsed, songs };
}
 
module.exports = { searchAll, searchByMood };