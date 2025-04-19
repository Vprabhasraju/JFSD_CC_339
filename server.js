const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const os = require('os'); // Added to find local network IP

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection
mongoose.connect('mongodb://localhost/connecthub')
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.log('Error connecting to MongoDB:', err);
  });

const chatSchema = new mongoose.Schema({
  username: String,
  message: String,
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

app.use(bodyParser.json());

// Serve static files (if needed)
app.use(express.static('public'));

// ✅ Add default route to confirm server is running
app.get('/', (req, res) => {
  res.send('✅ ConnectHub backend is running!');
});

// API endpoint to fetch chat history
app.get('/api/chats', async (req, res) => {
  const chats = await Chat.find().sort({ createdAt: -1 }).limit(50);
  res.json(chats);
});

// Socket.IO setup
let users = {};
io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join', username => {
    users[socket.id] = username;
    socket.broadcast.emit('userJoined', username);
  });

  socket.on('sendMessage', async message => {
    const chat = new Chat({ username: users[socket.id], message });
    await chat.save();
    io.emit('newMessage', { username: users[socket.id], message });
  });

  socket.on('disconnect', () => {
    const username = users[socket.id];
    delete users[socket.id];
    socket.broadcast.emit('userLeft', username);
  });
});

// Function to get local network IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Server listen on port 5000
const PORT = 5000;
server.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log('✅ Server running at:');
  console.log(`   → Local:   http://localhost:${PORT}`);
  console.log(`   → Network: http://${localIP}:${PORT}`);
});