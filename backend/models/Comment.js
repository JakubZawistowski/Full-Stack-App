// models/Comment.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    isReply: {  // Nowe pole do oznaczania odpowiedzi
        type: Boolean,
        default: false
    },
    parent: {  // Id głównego komentarza, jeśli jest odpowiedzią
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }
});

module.exports = mongoose.model('Comment', CommentSchema);

