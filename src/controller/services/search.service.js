const musicModel = require("../../model/music.model");
const albumModel = require("../../model/album.model");
const userModel = require("../../model/user.model");
const { extractMoodTagsFromFeeling, MOOD_TAGS } = require("./gemini.service");
 




function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
 






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
 
const songs = await musicModel.aggregate([
    { $match: { tags: { $in: tagsUsed } } },
    {
        $addFields: {
            matchCount: {
                $size: {
                    $setIntersection: [{ $ifNull: ["$tags", []] }, tagsUsed]
                }
            }
        }
    },
    { $sort: { matchCount: -1, _id: -1 } },
    { $limit: 15 }
]);

// options: { lean: true } is required for plain aggregate objects in Mongoose 9
await musicModel.populate(songs, {
    path: "artist",
    select: "name email",
    options: { lean: true }
});

return { tagsUsed, songs };
}






 
module.exports = { searchAll, searchByMood };