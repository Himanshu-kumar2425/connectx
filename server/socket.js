const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const onlineUsers = new Map(); // userId -> socketId

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      if (!cookieHeader) {
        return next(new Error('Authentication error: No cookies'));
      }
      
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      
      const token = cookies.token;
      if (!token) {
        return next(new Error('Authentication error: No token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // Track online status
    onlineUsers.set(socket.user._id.toString(), socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));

    // Join a specific room (chat ID)
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
    });

    // Handle typing indicators
    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('userTyping', {
        userId: socket.user._id,
        isTyping,
      });
    });

    // Handle sending messages (message content is already encrypted on client)
    socket.on('sendMessage', (data) => {
      // Broadcast to everyone in the room except sender
      socket.to(data.roomId).emit('newMessage', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
      onlineUsers.delete(socket.user._id.toString());
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

module.exports = { initializeSocket };
