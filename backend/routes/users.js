const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const path = require('path');
const multer = require("multer");
const Photo = require('../models/Photo');
const {unlinkSync, existsSync} = require("node:fs"); // Model zdjęcia

// Konfiguracja multer

// @route   POST api/users/register
// @desc    Register user
// @access  Public
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ustawienie katalogu na 'uploads/profile-pictures'
        cb(null, 'uploads/profile-pictures/');
    },
    filename: function (req, file, cb) {
        // Unikalna nazwa pliku
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage})
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');  // znajdź użytkownika w bazie danych i nie zwracaj hasła
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
const photoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/photos/'); // Katalog na zdjęcia użytkownika
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unikalna nazwa pliku
    }
});
const uploadPhoto = multer({ storage: photoStorage });

router.put('/profile-picture', verifyToken, upload.single('profilePicture'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.profilePicture = req.file.filename;  // Przechowujemy nazwę pliku w bazie danych
        await user.save();

        res.json({ profilePicture: user.profilePicture });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, location } = req.body;

    // Simple validation
    if (!firstName || !lastName || !email || !password || !location) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Check for existing user
    User.findOne({ email }).then(user => {
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const newUser = new User({
            firstName,
            lastName,
            email,
            password,
            friends: [],
            location,
            viewedProfile: 0,
        });

        // Create salt & hash
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser.save()
                res.status(201).json(newUser);
            });
        });
    });
});

// @route   POST api/users/login
// @desc    Login user
// @access  Public
router.post('/login', (req, res) => {
    console.log('Login route hit');
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Check for existing user
    User.findOne({ email }).then(user => {
        if (!user) return res.status(400).json({ msg: 'User does not exist' });

        // Validate password
        bcrypt.compare(password, user.password).then(isMatch => {
            if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

            jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        token,
                        user: {
                            id: user.id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            friends: user.friends,
                            location: user.location
                        }
                    });
                }
            );
            delete User.password;
        });
    });
});

router.get('/search', verifyToken, async (req, res) => {
    const query = req.query.query;

    try {
        if (!query) {
            return res.status(400).json({ message: 'Query parameter is missing' });
        }

        // Znajdź użytkowników, którzy pasują do imienia lub nazwiska (nie _id)
        const users = await User.find({
            $or: [
                { firstName: new RegExp(query, 'i') },
                { lastName: new RegExp(query, 'i') }
            ]
        });

        // Jeśli nie znaleziono użytkowników, zwróć pustą tablicę i status 200
        return res.json(users);  // Użytkowników może być 0, ale nie zwracamy 404
    } catch (error) {
        console.error('Error searching for users:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
// Przykładowy endpoint w Node.js/Express
router.get('/:userId/friends', verifyToken, async (req, res) => {
    const userId = req.params.userId;
    console.log(userId)
    try {
        const user = await User.findById(userId).populate('friends'); // Zakładając, że masz relację z modelu User
        res.json({ friends: user.friends });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching friends' });
    }
});


// Endpoint do dodawania ścieżki zdjęcia do użytkownika
router.post('/photos/upload', verifyToken, uploadPhoto.array('photos'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Dodaj ścieżki do tablicy images w modelu użytkownika
        req.files.forEach(file => {
            user.images.push(file.filename);
        });

        await user.save();

        res.json(user.images); // Zwróć zaktualizowaną tablicę zdjęć
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.delete('/photos/:imageName', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const imageName = req.params.imageName; // Nazwa pliku z parametrów URL
        const imageIndex = user.images.indexOf(imageName); // Sprawdź tylko nazwę pliku

        console.log('Image index:', imageIndex); // Debugowanie: sprawdź, czy indeks jest poprawny

        if (imageIndex === -1) {
            return res.status(404).json({ msg: 'Image not found' });
        }

        // Usuń ścieżkę z tablicy
        user.images.splice(imageIndex, 1);
        await user.save();

        // Usuń plik z serwera
        const filePath = path.join(__dirname, '..', 'uploads', 'photos', imageName);

        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }

        res.json({ msg: 'Image deleted', images: user.images });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// Endpoint do pobierania listy zdjęć użytkownika
router.get('/photos', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id; // Pobranie `_id` z `req.user`
        const user = await User.findById(userId).select('images'); // Znalezienie użytkownika po `ObjectId`
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Generuj pełne URL-e do obrazów
        const imageUrls = user.images.map(imageName => `${req.protocol}://${req.get('host')}/uploads/photos/${imageName}`);

        res.json(imageUrls); // Zwróć tablicę URL-i do zdjęć
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

