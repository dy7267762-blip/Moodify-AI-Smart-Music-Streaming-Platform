// A controlled vocabulary keeps AI output predictable: Gemini can only ever
// pick from this list, both when auto-tagging a song at upload time and when
// interpreting a user's "how I feel" search query. This avoids messy,
// inconsistent free-text tags and keeps the MongoDB query a simple $in.

const MOOD_TAGS = [
    "happy",
    "sad",
    "energetic",
    "chill",
    "romantic",
    "angry",
    "nostalgic",
    "motivational",
    "relaxing",
    "party",
    "heartbreak",
    "peaceful",
    "love"
];

module.exports = MOOD_TAGS;