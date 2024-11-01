const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            min: 2,
            max: 50,
        },
        lastName: {
            type: String,
            required: true,
            min: 2,
            max: 50,
        },
        email: {
            type: String,
            required: true,
            max: 50,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            min: 5,
        },
        friends: {
            type: Array,
            default: [],
        },
        profilePicture: {
            type: String,
            default: 'default-pic.jpg'
        },
        location: String,
        viewedProfile: Number,
        images: [
            {
                type: String, // Przechowywanie ścieżki do zdjęcia jako string
            }
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
