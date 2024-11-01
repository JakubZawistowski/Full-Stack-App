const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { verifyToken } = require('../middleware/auth'); // Poprawna ścieżka do middleware
const multer = require('multer');
const storage = require('../middleware/storage')
const Comment = require('../models/Comment');


const upload = multer({ storage: storage})

// Dodawanie nowego posta
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const newPost = new Post({
            user: req.user.id,
            content: req.body.content,
            image: req.file ? req.file.filename : null, // jeśli zdjęcie zostało przesłane, zapisujemy jego nazwę
        });

        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Pobieranie wszystkich postów
router.get('/', verifyToken, async (req, res) => {
    try {
        const posts = await Post.find().populate('user', ['firstName', 'lastName']);
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Pobieranie postów użytkownika
router.get('/my-posts', verifyToken, async (req, res) => {
    try {
        const posts = await Post.find({ user: req.user.id }).populate('user', ['firstName', 'lastName']);
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/:id/posts', verifyToken, async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.id }).populate('user', ['firstName', 'lastName']);
        if (!posts) {
            return res.status(404).json({ msg: 'No posts found for this user' });
        }
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Aktualizacja treści
        post.content = req.body.content || post.content;

        // Jeśli zostało przesłane nowe zdjęcie
        if (req.file) {
            post.image = req.file.filename;
        }

        await post.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.delete('/del/:postId', async (req, res) => {
    const { postId } = req.params;  // Pobranie ID posta z parametrów URL

    try {
        // Znajdź post po ID i usuń go
        const deletedPost = await Post.findByIdAndDelete(postId);

        if (!deletedPost) {
            // Jeśli post nie istnieje, zwróć odpowiedź 404
            return res.status(404).json({ message: 'Post not found' });
        }

        // Jeśli post został pomyślnie usunięty
        res.status(200).json({ message: 'Post successfully deleted', post: deletedPost });
    } catch (error) {
        console.error('Error deleting post:', error);
        // Jeśli wystąpił błąd, zwróć odpowiedź 500
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/:postId/comments', verifyToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;

        // Znalezienie posta, aby upewnić się, że istnieje
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Tworzenie nowego komentarza
        const newComment = new Comment({
            post: postId,
            user: req.user.id,
            content
        });

        const comment = await newComment.save();
        res.status(201).json(comment);
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).send('Server Error');
    }
});

// Pobieranie komentarzy do posta
router.get('/:postId/comments', async (req, res) => {
    const { postId } = req.params;

    try {
        const comments = await Comment.find({ post: postId, isReply: false })
            .populate('user', 'firstName lastName')
            .populate({
                path: 'replies',
                match: { isReply: true },
                populate: { path: 'user', select: 'firstName lastName' }
            });

        res.json(comments);
    } catch (error) {
        console.error('Błąd podczas pobierania komentarzy:', error);
        res.status(500).json({ message: 'Błąd podczas pobierania komentarzy' });
    }
});

// Dodawanie odpowiedzi na komentarz
router.post('/:postId/comments/:commentId/replies', verifyToken, async (req, res) => {
    console.log('skibidi');
    const { postId, commentId } = req.params; // Odczytaj ID posta i komentarza z parametrów
    const { content } = req.body; // Odczytaj treść odpowiedzi z ciała zapytania
    // Upewnij się, że req.user istnieje
    if (!req.user || !req.user.id) {
        return res.status(403).json({ message: 'Użytkownik nie jest zalogowany lub brak ID użytkownika.' });
    }

    try {
        // Tworzenie nowej odpowiedzi
        const newReply = new Comment({
            post: postId,
            user: req.user.id,
            content: content,
            isReply: true, // Ustaw pole isReply na true
            parent: commentId // Ustaw ID głównego komentarza
        });

        // Zapisz nową odpowiedź w bazie
        await newReply.save();

        // Zaktualizuj oryginalny komentarz, dodając ID odpowiedzi do pola `replies`
        await Comment.findByIdAndUpdate(commentId, {
            $push: { replies: newReply._id }
        });

        res.status(201).json(newReply); // Zwróć nową odpowiedź
    } catch (error) {
        console.error('Błąd dodawania odpowiedzi:', error);
        res.status(500).json({ message: 'Błąd podczas dodawania odpowiedzi' });
    }
});

// Lajkowanie komentarza
router.post('/:postId/comments/:commentId/like', verifyToken, async (req, res) => {
    try {
        const { postId, commentId } = req.params;

        // Znajdź komentarz
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Sprawdź, czy użytkownik już polajkował ten komentarz
        if (comment.likes.includes(req.user.id)) {
            // Jeśli już polajkował, usuń lajka
            comment.likes = comment.likes.filter(userId => userId.toString() !== req.user.id);
        } else {
            // Jeśli jeszcze nie polajkował, dodaj lajka
            comment.likes.push(req.user.id);
        }

        await comment.save();
        res.json(comment);
    } catch (err) {
        console.error('Error liking comment:', err);
        res.status(500).send('Server Error');
    }
});

router.post('/:postId/comments/:commentId/dislike', verifyToken, async (req, res) => {
    try {
        const { postId, commentId } = req.params;

        // Znajdź komentarz
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Sprawdź, czy użytkownik już wyraził dislike
        if (comment.dislikes.includes(req.user.id)) {
            // Jeśli już wyraził dislike, usuń dislike
            comment.dislikes = comment.dislikes.filter(userId => userId.toString() !== req.user.id);
        } else {
            // Jeśli jeszcze nie wyraził dislike'u, dodaj dislike
            comment.dislikes.push(req.user.id);
        }

        await comment.save();
        res.json(comment);
    } catch (err) {
        console.error('Error disliking comment:', err);
        res.status(500).send('Server Error');
    }
});

// Lajkowanie posta
router.post('/:postId/like', verifyToken, async (req, res) => {
    try {
        const { postId } = req.params;

        // Znajdź post
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Sprawdź, czy użytkownik już polajkował ten post
        if (post.likes.includes(req.user.id)) {
            // Jeśli już polajkował, usuń lajka
            post.likes = post.likes.filter(userId => userId.toString() !== req.user.id);
        } else {
            // Jeśli jeszcze nie polajkował, dodaj lajka i usuń dislike, jeśli istnieje
            post.likes.push(req.user.id);
            post.dislikes = post.dislikes.filter(userId => userId.toString() !== req.user.id);
        }

        await post.save();
        res.json(post);
    } catch (err) {
        console.error('Error liking post:', err);
        res.status(500).send('Server Error');
    }
});

// Dislajkowanie posta
router.post('/:postId/dislike', verifyToken, async (req, res) => {
    try {
        const { postId } = req.params;

        // Znajdź post
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Sprawdź, czy użytkownik już wyraził dislike
        if (post.dislikes.includes(req.user.id)) {
            // Jeśli już wyraził dislike, usuń dislike
            post.dislikes = post.dislikes.filter(userId => userId.toString() !== req.user.id);
        } else {
            // Jeśli jeszcze nie wyraził dislike'u, dodaj dislike i usuń lajk, jeśli istnieje
            post.dislikes.push(req.user.id);
            post.likes = post.likes.filter(userId => userId.toString() !== req.user.id);
        }

        await post.save();
        res.json(post);
    } catch (err) {
        console.error('Error disliking post:', err);
        res.status(500).send('Server Error');
    }
});


module.exports = router;