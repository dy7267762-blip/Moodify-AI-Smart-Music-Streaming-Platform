
const express = require('express')
const musicController = require('../controller/music.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const multer = require('multer')
 
const upload = multer({
    storage: multer.memoryStorage()
})
 
const router = express.Router();
 
// Everything here requires login - search included.
router.get('/search', authMiddleware.authUser, musicController.searchMusic)
router.get('/search/mood', authMiddleware.authUser, musicController.searchMoodMusic)
 
router.post('/upload', authMiddleware.authArtist, upload.single('music'), musicController.createMusic)
router.post('/album', authMiddleware.authArtist, musicController.createAlbum)
 
router.get('/', authMiddleware.authUser, musicController.getAllMusics)
 
router.get('/albums', authMiddleware.authUser, musicController.getAllAlbums)
router.get('/albums/:albumId', authMiddleware.authUser, musicController.getAlbumById)
 
module.exports = router;
 