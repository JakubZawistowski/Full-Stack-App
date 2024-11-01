const express = require('express');
const router = express.Router();
const {verifyToken} = require("../middleware/auth");
const User = require("../models/User");

router.post('/add', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;  // ID zalogowanego użytkownika
        const { friendId } = req.body;  // ID użytkownika, którego chcemy dodać do znajomych

        // Znajdź obu użytkowników w bazie danych
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!user || !friend) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Sprawdź, czy użytkownik nie jest już znajomym
        if (user.friends.includes(friendId)) {
            return res.status(400).json({ message: 'You are already friends' });
        }

        // Dodaj znajomego do obu list znajomych (wzajemnie)
        user.friends.push(friendId);
        friend.friends.push(userId);

        // Zapisz zmiany w bazie danych
        await user.save();
        await friend.save();

        res.status(200).json({ message: 'Friend added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.delete('/remove/:friendId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id; // ID zalogowanego użytkownika
        const { friendId } = req.params; // Pobieramy friendId z parametrów URL

        console.log("userId:", userId);
        console.log("friendId", friendId);

        // Znajdź zalogowanego użytkownika i znajomego
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!user || !friend) {
            return res.status(404).json({ message: 'User or friend not found' });
        }

        // Sprawdź, czy użytkownik jest na liście znajomych
        if (!user.friends.includes(friendId)) {
            return res.status(400).json({ message: 'This user is not your friend' });
        }

        // Usuń znajomego z listy znajomych użytkownika
        user.friends = user.friends.filter(id => id.toString() !== friendId.toString());

        // Usuń zalogowanego użytkownika z listy znajomych tej osoby
        friend.friends = friend.friends.filter(id => id.toString() !== userId.toString());

        // Zapisz zmiany w bazie danych
        await user.save();
        await friend.save();

        console.log("user friends:", user.friends);
        console.log("friend friends:", friend.friends);

        res.status(200).json({ message: 'Friend removed successfully from both users' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ message: 'Server error' });
    }
});




router.get('/my-friends', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', 'firstName lastName profilePicture');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.friends);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:userId/friends', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId === 'me' ? req.user.id : req.params.userId; // 'me' means current user

        const user = await User.findById(userId).populate('friends', 'firstName lastName profilePicture');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.friends);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;