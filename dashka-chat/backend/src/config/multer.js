const multer = require('multer');
const path = require('path');
const config = require('./index');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.paths.temp);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { 
    fileSize: config.limits.maxFileSize 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Только аудио файлы разрешены'));
    }
  }
});

module.exports = upload;