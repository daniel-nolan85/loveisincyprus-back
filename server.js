const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const { readdirSync } = require('fs');
require('dotenv').config();
const Chat = require('./models/chat');
const User = require('./models/user');
const rateLimit = require('express-rate-limit');

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

// rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 150 requests per `window` (here, per 15 minutes)
  message: 'Too many requests', // message to send
});

// middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb' }));
app.use(cors());
app.use(limiter);

// routes middleware
readdirSync('./routes').map((r) => app.use('/api', require(`./routes/${r}`)));

// port
const port = process.env.PORT || 8000;

const server = app.listen(port, () =>
  console.log(`Server is running on port ${port}`)
);

const io = require('socket.io')(server, {
  // wsEngine: 'ws',
  path: '/socket.io',
  pingTimeout: 60000,
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-type'],
  },
  maxHttpBufferSize: 1e8,
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
  socket.on('typing', (_id, theirId) => {
    socket.in(theirId).emit('typing', _id);
  });
  socket.on('stop typing', (room) => {
    console.log('stop typing');
    console.log(room);
    socket.in(room).emit('stop typing');
  });
  socket.on('new message', (newMessageReceived) => {
    var chat = newMessageReceived.chat;
    if (!chat.users) return console.log('chat.users not defined');
    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;
      socket
        .in(user._id)
        .emit('message received', newMessageReceived, user._id);
    });
    // console.log('newMessageReceived => ', newMessageReceived);
  });
  socket.on('new mass mail', (newMessageReceived) => {
    console.log('newMessageReceived => ', newMessageReceived);
    var chat = newMessageReceived.chat;
    if (!chat.users) return console.log('chat.users not defined');
    socket.broadcast.emit('mass mail received', newMessageReceived);
  });
  socket.on('reorder users', (chats, _id, theirChats, theirId) => {
    console.log('chats => ', chats);
    console.log('_id => ', _id);
    console.log('theirChats => ', theirChats);
    console.log('theirId => ', theirId);
    socket.in(_id).emit('my users reordered', chats, _id);
    socket.in(theirId).emit('their users reordered', theirChats, theirId);
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
  socket.on('new event', (event) => {
    console.log(event);
    socket.in(event.invitees.map((e) => e._id)).emit('event added', event);
  });

  socket.off('setup', () => {
    console.log('USER DISCONNECTED');
    socket.leave(userData._id);
  });
});
