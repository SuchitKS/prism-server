const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Device connected:', socket.id);

    socket.on('join', (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined room: ${roomId}`);
        socket.to(roomId).emit('peer-joined', { id: socket.id });
    });

    socket.on('message', (data) => {
        const { roomId, ...payload } = data;
        if (roomId) {
            socket.to(roomId).emit('message', payload);
        } else {
            socket.broadcast.emit('message', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('Device disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server on port ${PORT}`));
