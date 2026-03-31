const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

// Serve the static HTML/JS files for the Web Client
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A device connected:', socket.id);

    // Act as a pure relay: whatever message one peer sends, broadcast it to the other
    socket.on('message', (message) => {
        socket.broadcast.emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('Device disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});