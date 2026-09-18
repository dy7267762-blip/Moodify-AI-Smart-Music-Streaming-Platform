const mongoose= require('mongoose');
const MOOD_TAGS = require('../constants/moodTags');
 
const musicSchema= new mongoose.Schema({
    url:{
        type:String,
        required:true
    },
    artist:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required : true
 
    },
    title:{
        type:String,
        required:true
    },
    tags:{
        type:[String],
        enum: MOOD_TAGS,
        default: []
    }
})
 
const musicModel=mongoose.model("music", musicSchema);
 
module.exports=musicModel;
 