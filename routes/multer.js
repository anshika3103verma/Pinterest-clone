const multer = require('multer');
const { randomUUID } = require('crypto');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads');
    },
    filename: function (req, file, cb) {
        const uniqueFilename = uuidv4();
        cb(null, uniqueFilename+path.extname( file.originalname));
    }
});

const upload = multer({ storage: storage });

module.exports = upload;