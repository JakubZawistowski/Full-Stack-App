const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const chatSchema = new Schema({
    isGroupChat: { type: Boolean, default: false },
    groupName: { type: String, required: function() { return this.isGroupChat; } },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [
        {
            sender: { type: Schema.Types.ObjectId, ref: 'User' },
            content: { type: String },
            imageUrl: { type: String }, // Dodane pole do przechowywania URL obrazu
            audioUrl: { type: String }, // Dodane pole do przechowywania URL audio
            isImage: { type: Boolean, default: false }, // Flaga wskazująca, czy wiadomość jest obrazem
            isAudio: { type: Boolean, default: false }, // Flaga wskazująca, czy wiadomość jest audio
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
