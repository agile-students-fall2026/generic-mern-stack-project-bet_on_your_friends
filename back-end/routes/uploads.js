// routes for uploading images -> /api/uploads
const express = require('express')
const multer = require('multer')
const path = require('path')
const { randomUUID } = require('crypto')

const router = express.Router()

// folder uploaded images are saved in, served by express.static in app.js
const uploadsFolder = path.join(__dirname, '..', 'uploads')

// largest image that can be uploaded -> 5 MB
const maxFileSize = 5 * 1024 * 1024

// image types and extensions that can be uploaded
const imageExtensions = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
}

// save each image with a random name so uploads never overwrite each other
const storage = multer.diskStorage({
  destination: uploadsFolder,
  filename: (req, file, callback) => {
    callback(null, `${randomUUID()}${imageExtensions[file.mimetype]}`)
  }
})

// skip any file that isn't an allowed image type
const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, callback) => {
    callback(null, file.mimetype in imageExtensions)
  }
})

// upload image -> POST /api/uploads with an "image" file in form data
router.post('/', (req, res) => {
  upload.single('image')(req, res, (error) => {
    // multer errors, such as a file that's too big
    if (error) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Images must be 5 MB or smaller.'
          : 'This image could not be uploaded.'

      return res.status(400).json({ error: message })
    }

    // no file was sent or it wasn't an image
    if (!req.file) {
      return res.status(400).json({ error: 'Please choose an image file.' })
    }

    // the image is served from /uploads by express.static
    res.status(201).json({ url: `/uploads/${req.file.filename}` })
  })
})

module.exports = router
