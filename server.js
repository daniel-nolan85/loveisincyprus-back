const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const { readdirSync } = require('fs');
require('dotenv').config();
const Chat = require('./models/chat');
const User = require('./models/user');

// app
const app = express();

// db
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => console.log('DB CONNECTED'))
  .catch((err) => console.log(`DB CONNECTION ERR ${err}`));

// middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(cors());

// routes middleware
readdirSync('./routes').map((r) => app.use('/api', require(`./routes/${r}`)));

// port
const port = process.env.PORT || 8000;

const server = app.listen(port, () =>
  console.log(`Server is running on port ${port}`)
);

const io = require('socket.io')(server, {
  pingTimeout: 60000,
  cors: {
    origin: 'http://localhost:3000',
  },
});

io.on('connection', (socket) => {
  console.log('connected to socket.io');
  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit('connected');
  });
  socket.on('join chat', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });
  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));
  socket.on('new message', (newMessageReceived) => {
    var chat = newMessageReceived.chat;
    if (!chat.users) return console.log('chat.users not defined');
    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;
      socket.in(user._id).emit('message received', newMessageReceived);
    });
  });
  socket.on('like post', (post) =>
    socket.in(post.postedBy).emit('post liked', post)
  );
  socket.on('new comment', (p) =>
    socket.in(p.postedBy._id).emit('comment added', p)
  );
  socket.on('new follower', (f) =>
    socket.in(f.following[f.following.length - 1]._id).emit('follower added', f)
  );
  socket.on('new visitor', (v, u) =>
    socket.in(v._id).emit('visitor added', v, u)
  );

  socket.off('setup', () => {
    console.log('USER DISCONNECTED');
    socket.leave(userData._id);
  });
});
