const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Invitation = require('../models/Invitation');
const User = require('../models/User');

// Wysyłanie zaproszenia
router.post('/send', verifyToken, async (req, res) => {
    const { receiverId } = req.body;

    if (!receiverId) {
        return res.status(400).json({ message: 'Receiver ID is required' });
    }

    try {
        const existingInvitation = await Invitation.findOne({
            sender: req.user.id,
            receiver: receiverId,
            status: 'pending'
        });
        if (existingInvitation) {
            console.log('eszkere')
            return res.status(400).json({ message: 'Invitation already sent' });
        }

        const invitation = new Invitation({
            sender: req.user.id,
            receiver: receiverId,
            status: 'pending' // Ustaw status jako pending
        });
        await invitation.save();
        res.status(201).json({ message: 'Invitation sent successfully', invitation });
    } catch (error) {
        console.error('Error sending invitation:', error); // Dodanie logowania błędu
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Akceptowanie zaproszenia
router.post('/accept/:invitationId', verifyToken, async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.invitationId);
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        // Zaktualizuj status zaproszenia
        invitation.status = 'accepted';
        await invitation.save();

        // Dodaj użytkownika do listy znajomych
        await User.findByIdAndUpdate(invitation.sender, { $addToSet: { friends: invitation.receiver } });
        await User.findByIdAndUpdate(invitation.receiver, { $addToSet: { friends: invitation.sender } });

        res.json({ message: 'Invitation accepted', invitation });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Odrzucanie zaproszenia
router.post('/decline/:invitationId', verifyToken, async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.invitationId);
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        invitation.status = 'declined';
        await invitation.save();

        res.json({ message: 'Invitation declined', invitation });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Pobieranie zaproszeń użytkownika
router.get('/my-invitations', verifyToken, async (req, res) => {
    try {
        const invitations = await Invitation.find({ receiver: req.user.id, status: 'pending' })
            .populate('sender', 'firstName lastName email');
        res.json(invitations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Pobieranie wysłanych zaproszeń
router.get('/sent-invitations', verifyToken, async (req, res) => {
    try {
        const invitations = await Invitation.find({ sender: req.user.id, status: 'pending' })
            .populate('receiver', 'firstName lastName email');
        res.json(invitations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Pobieranie historii zaproszeń (zaakceptowane i odrzucone)
router.get('/invitation-history', verifyToken, async (req, res) => {
    try {
        const invitations = await Invitation.find({
            $or: [
                { sender: req.user.id },
                { receiver: req.user.id }
            ]
        }).populate('sender receiver', 'firstName lastName email');
        res.json(invitations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
