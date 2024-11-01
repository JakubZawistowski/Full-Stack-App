const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Chat = require('../models/Chat')
const User = require('../models/User');
const { io } = require('../server');
const multer = require('multer');
const path = require('path');
const storage = require('../middleware/storage')
const upload = multer({ storage })

router.get('/chats', verifyToken, async (req, res) => {
    try {
        console.log("User ID:", req.user.id); // Sprawdzamy, czy middleware ustawia poprawne ID

        const chats = await Chat.find({ participants: req.user.id })
            .populate('participants', 'firstName lastName');
        res.json(chats);
    } catch (error) {
        console.error("Error fetching chats:", error); // Dokładne logowanie błędu
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Pobranie wiadomości z konkretnego czatu
router.get('/chats/:chatId', verifyToken, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('messages.sender', 'firstName lastName'); // Pobieramy wiadomości wraz z danymi nadawców

        // Sprawdzenie, czy użytkownik jest uczestnikiem czatu
        if (!chat.participants.includes(req.user.id)) { // Zmienione na .id
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Dodawanie wiadomości do czatu
router.post('/chats/:chatId/message', verifyToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
    try {
        const { content } = req.body;
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Sprawdzenie, czy użytkownik jest uczestnikiem czatu
        if (!chat.participants.includes(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Pobierz pełne dane o nadawcy
        const senderUser = await User.findById(req.user.id);

        // Tworzenie obiektu wiadomości
        const message = {
            sender: {
                _id: senderUser._id,
                firstName: senderUser.firstName,
                lastName: senderUser.lastName,
            },
            content: content || null,
            imageUrl: req.files['image'] ? req.files['image'][0].path.replace(/\\/g, '/') : null, // Używamy imageUrl zamiast image
            audioUrl: req.files['audio'] ? req.files['audio'][0].path.replace(/\\/g, '/') : null, // Dodajemy audioUrl
            isImage: !!req.files['image'],
            isAudio: !!req.files['audio'], // Ustawiamy flagę na podstawie obecności audio
            createdAt: new Date()
        };

        chat.messages.push(message);
        await chat.save();

        // Emitowanie wiadomości przez socket
        io.to(req.params.chatId).emit('message', message);

        res.json(message);
    } catch (error) {
        console.error(error); // Dobrą praktyką jest logowanie błędów
        res.status(500).json({ message: 'Server error' });
    }
});



// Tworzenie nowego czatu
router.post('/chats', verifyToken, async (req, res) => {
    const { participants, isGroupChat, groupName } = req.body;
    if (!participants || participants.length === 0) {
        return res.status(400).json({ message: 'Participants are required' });
    }

    try {
        const newChat = new Chat({
            participants: [req.user.id, ...participants],
            isGroupChat: isGroupChat || false, // Ustawić jako false, jeśli nie podano
            groupName: isGroupChat ? groupName : undefined, // Ustawić nazwę grupy tylko dla czatów grupowych
            messages: []
        });

        await newChat.save();
        res.status(201).json(newChat);
    } catch (error) {
        console.error('Error creating chat:', error); // Logowanie błędu
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.post('/create-group', verifyToken, async (req, res) => {
    const { groupName, participants, moderators } = req.body; // Dodano moderators do destrukturyzacji

    // Sprawdź, czy grupa ma nazwę i co najmniej 2 uczestników
    if (!groupName || participants.length < 2 || !moderators || moderators.length < 1) {
        return res.status(400).json({ error: 'Group must have a name, at least 2 participants, and at least 1 moderator' });
    }

    try {
        const newGroupChat = new Chat({
            isGroupChat: true,
            groupName,
            participants,
            moderators // Użyj przekazanych moderatorów
        });

        await newGroupChat.save();
        res.status(201).json(newGroupChat);
    } catch (error) {
        console.error('Error creating group chat:', error);
        res.status(500).json({ error: 'Error creating group chat' });
    }
});


// Dodawanie nowego moderatora
router.put('/chats/:chatId/moderator/:userId',verifyToken, async (req, res) => {
    const { chatId, userId } = req.params;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        // Sprawdź, czy użytkownik jest moderatorem
        if (!chat.moderators.includes(req.user.id)) {
            return res.status(403).json({ message: 'Only a moderator can appoint a new moderator' });
        }

        // Dodaj moderatora do listy moderatorów, jeśli jeszcze go tam nie ma
        if (!chat.moderators.includes(userId)) {
            chat.moderators.push(userId);
            await chat.save();
        }

        res.status(200).json({ message: 'New moderator added' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding new moderator', error });
    }
});

// Usunięcie moderatora
router.delete('/chats/:chatId/moderators/:userId', async (req, res) => {
    const { chatId, userId } = req.params;

    try {
        // Znajdź czat i usuń moderatora
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).send('Czat nie znaleziony');
        }

        // Usuń użytkownika z listy moderatorów
        chat.moderators = chat.moderators.filter(moderator => moderator.toString() !== userId);
        await chat.save();

        res.status(200).send('Moderator został usunięty');
    } catch (error) {
        console.error(error);
        res.status(500).send('Błąd serwera');
    }
});

// Usuwanie moderatora


// Zmiana nazwy grupy
router.put('/chats/:chatId/groupName',verifyToken ,async (req, res) => {
    const { chatId } = req.params;
    const { newName } = req.body;
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        // Sprawdź, czy użytkownik jest moderatorem
        if (!chat.moderators.includes(req.user.id)) {
            return res.status(403).json({ message: 'Only a moderator can change the group name' });
        }

        // Zmiana nazwy grupy
        chat.groupName = newName;
        await chat.save();

        res.status(200).json({ message: 'Group name updated', groupName: newName });
    } catch (error) {
        res.status(500).json({ message: 'Error updating group name', error });
    }
});
// Pobranie dostępnych uczestników do dodania jako moderatorzy
router.get('/chats/:chatId/available-participants', verifyToken, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId).populate('participants', 'firstName lastName');
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        // Pobierz wszystkich użytkowników
        const allUsers = await User.find().select('firstName lastName');

        // Filtruj użytkowników, aby wykluczyć już istniejących uczestników i moderatorów
        const currentParticipants = chat.participants.map(p => p._id.toString());
        const currentModerators = chat.moderators.map(m => m.toString());

        const availableParticipants = allUsers.filter(user =>
            !currentParticipants.includes(user._id.toString()) &&
            !currentModerators.includes(user._id.toString())
        );

        res.json(availableParticipants);
    } catch (error) {
        console.error("Error fetching available participants:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/chats/:chatId/participants', async (req, res) => {
    const { chatId } = req.params;

    try {
        const chat = await Chat.findById(chatId).populate('participants', 'firstName lastName _id');
        if (!chat) {
            return res.status(404).json({ message: 'Czat nie znaleziony' });
        }

        const participants = chat.participants; // zakładając, że pole participants zawiera ID uczestników
        res.json(participants);
    } catch (error) {
        console.error('Błąd podczas pobierania uczestników czatu:', error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Endpoint do usuwania uczestnika z grupy
router.delete('/chats/:chatId/participants/:userId', async (req, res) => {
    const { chatId, userId } = req.params;

    try {
        // Znajdź czat i usuń uczestnika z grupy
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Usuń uczestnika z listy uczestników
        chat.participants = chat.participants.filter(participant => participant.toString() !== userId);

        // Jeśli użytkownik był moderatorem, usuń go również z listy moderatorów
        chat.moderators = chat.moderators.filter(moderator => moderator.toString() !== userId);

        // Zapisz zmiany
        await chat.save();

        res.status(200).json({ message: 'User removed from the group' });
    } catch (error) {
        console.error('Błąd podczas usuwania uczestnika z grupy:', error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

router.post('/:chatId/add-user', verifyToken, async (req, res) => {
    const { chatId } = req.params;
    const { userId } = req.body; // Użytkownik, który ma zostać dodany

    try {
        // Znajdź czat na podstawie chatId
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Sprawdź, czy użytkownik już jest uczestnikiem czatu
        if (chat.participants.includes(userId)) {
            return res.status(400).json({ message: 'User is already a participant' });
        }

        // Dodaj użytkownika do czatu
        chat.participants.push(userId);
        await chat.save();

        // Opcjonalnie - znajdź szczegóły użytkownika, którego dodano
        const user = await User.findById(userId).select('firstName lastName'); // Zmodyfikuj, aby zawierał wszystkie wymagane pola

        res.status(200).json({ message: 'User added successfully', user });
    } catch (error) {
        console.error('Error adding user to chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.delete('/:chatId', verifyToken, async (req, res) => {
    const { chatId } = req.params;

    try {
        // Znajdź czat na podstawie chatId
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }


        if (!chat.moderators.includes(req.user.id)) {
            return res.status(403).json({ message: 'You do not have permission to delete this chat' });
        }

        // Usuń czat
        await chat.remove();
        res.status(200).json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Endpoint do przesyłania zdjęć z czatu
router.post('/:chatId/upload-image', verifyToken, upload.single('image'), async (req, res) => {
    const { chatId } = req.params;

    try {
        // Znajdź czat na podstawie chatId
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Sprawdzenie, czy użytkownik jest uczestnikiem czatu
        if (!chat.participants.includes(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // Zapisz URL obrazu
        const imageUrl = `http://localhost:3002/uploads/chatImages/${req.file.filename}`;
        const message = {
            sender: req.user.id,
            content: imageUrl,
            isImage: true,
            timestamp: new Date(),
        };

        // Dodaj wiadomość do czatu
        chat.messages.push(message);
        await chat.save();

        // Emitowanie wiadomości przez socket
        io.to(chatId).emit('message', message);

        res.status(200).json({ message: 'Image uploaded successfully', imageUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = router;
