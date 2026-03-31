const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

app.use(express.static('public'));

/**
 * Room-based signaling:
 *   - Android host calls:   socket.emit('join', 'prism-room')
 *   - Browser client calls: socket.emit('join', 'prism-room')
 *   Both land in the same room.  Any 'message' one sends is relayed
 *   only to the OTHER sockets in that room (not back to the sender).
 *
 *   This fixes the bug where two browser tabs would receive each
 *   other's offers instead of the Android host's offer.
 */
io.on('connection', (socket) => {
    console.log('Device connected:', socket.id);

    socket.on('join', (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined room: ${roomId}`);
        // Notify others in the room that a new peer arrived
        socket.to(roomId).emit('peer-joined', { id: socket.id });
    });

    socket.on('message', (data) => {
        // data must include roomId so we relay only within that room
        const { roomId, ...payload } = data;
        if (roomId) {
            socket.to(roomId).emit('message', payload);
        } else {
            // Fallback: broadcast to everyone except sender (old behaviour)
            socket.broadcast.emit('message', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('Device disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
