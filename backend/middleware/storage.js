const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Sprawdź, czy zapytanie dotyczy czatu
        if (req.baseUrl.includes('/chat')) {
            cb(null, 'uploads/chatImages/'); // Zapisz w folderze 'chatImages' dla czatów
        } else {
            cb(null, 'uploads/'); // Inne pliki mogą być zapisane w głównym folderze 'uploads'
        }
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unikalna nazwa pliku
    }
});

module.exports = storage;