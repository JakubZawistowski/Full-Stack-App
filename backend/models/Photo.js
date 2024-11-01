const mongoose = require('mongoose');

const Photo = new mongoose.Schema({
    url: {
        type: String,
        required: true, // Ścieżka do zdjęcia jest wymagana
    },
    description: {
        type: String,
        default: '', // Opcjonalne pole opisu zdjęcia
    },
    uploadedAt: {
        type: Date,
        default: Date.now, // Data przesłania zdjęcia
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencja do modelu użytkownika (jeśli jest dostępne)
        required: true,
    }
});

// Eksport modelu
module.exports = mongoose.model('Photo', Photo);
