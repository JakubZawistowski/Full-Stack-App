const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const socketIo = require('socket.io');
const http = require('http'); // Import http
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002; // Dodaj fallback na wypadek braku PORT w .env
const server = http.createServer(app); // Utwórz serwer HTTP
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // Adres frontend-u
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    withCredentials: true,
});
module.exports = { io }; // Eksportujemy io
// Middlewares
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Routes
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/invitations', require('./routes/invitations'))
// Handle incoming WebSocket connections
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
        console.log(`User connected with ID: ${userId}`);
        // Save socket.id in userSocketMap if needed
    }

    // Nasłuchuj na wiadomości
    socket.on('message', (message) => {
        console.log('Received message:', message);
        // Broadcast wiadomości do wszystkich klientów
        io.emit('message', message);
    });

    // Nasłuchuj na rozłączenia
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Upewnij się, że serwer nasłuchuje
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));




