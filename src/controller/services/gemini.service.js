const MOOD_TAGS = require("../../constants/moodTags");
 
// Using plain fetch against the Gemini REST API (no extra SDK dependency),
// so this works the same locally and on any deployment host without needing
// native bindings or extra build steps. Requires GEMINI_API_KEY in env.
async function callGemini(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
 
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set");
    }
    const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
 
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(6000),
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
 
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errText}`);
    }
 
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text;
}
 
function extractTagArray(text) {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
 
    try {
        const parsed = JSON.parse(match[0]);
        if (!Array.isArray(parsed)) return [];
        // Only ever trust tags that are actually in our fixed vocabulary
        return parsed
            .map((t) => String(t).toLowerCase().trim())
            .filter((t) => MOOD_TAGS.includes(t));
    } catch {
        return [];
    }
}
 
// Auto-tag a song at upload time, based on its title.
async function generateTagsForSong(title) {
    const prompt = `You are tagging a song with mood/genre labels.
Allowed tags (choose ONLY from this list): ${MOOD_TAGS.join(", ")}.
Song title: "${title}"
Pick 2 to 4 tags from the allowed list that best fit this song title.
Respond with ONLY a JSON array of strings, nothing else, no explanation.
Example response: ["happy","energetic"]`;
 
    const text = await callGemini(prompt);
    return extractTagArray(text);
}
 
// Interpret a free-text "how I feel" query into matching mood tags.
async function extractMoodTagsFromFeeling(feelingText) {
    const prompt = `A user is describing how they feel or what kind of songs they want to hear right now. so generate few tags from whatever is in "${feelingText}".
but Allowed tags (choose ONLY from this list): ${MOOD_TAGS.join(", ")}.
User said: "${feelingText}"
Pick 1 to 4 tags from the allowed list that best match to their situation .
Respond with ONLY a JSON array of strings, nothing else, no explanation.
Example response: ["sad","chill"]`;
 
    const text = await callGemini(prompt);
    return extractTagArray(text);
}
 
module.exports = { generateTagsForSong, extractMoodTagsFromFeeling, MOOD_TAGS };