const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const { readdirSync } = require('fs');
require('dotenv').config();
const rateLimit = require('express-rate-limit');

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
  .then(async () => {
    console.log('DB CONNECTED');
    // await User.collection.dropIndexes({
    //   name: 'text',
    //   email: 'text',
    //   username: 'text',
    // });
    // User.schema.index({ name: 'text', email: 'text', username: 'text' });
    // console.log('TEXT INDEX UPDATED');
    // const users = await User.find();
    // users.forEach(async (user) => {
    //   user.name = user.name || '';
    //   user.email = user.email || '';
    //   user.username = user.username || '';
    //   await user.save();
    // });
    // console.log('ALL USERS UPDATED');
  })
  .catch((err) => console.log(`DB CONNECTION ERR ${err}`));

// rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
  message: 'Too many requests', // message to send
});

// middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb' }));
app.use(cors());
// app.use(limiter);

// routes middleware
readdirSync('./routes').map((r) => app.use('/api', require(`./routes/${r}`)));

// port
const port = process.env.PORT || 8000;

const server = app.listen(port, () =>
  console.log(`Server is running on port ${port}`)
);

const io = require('socket.io')(server, {
  path: '/socket.io',
  pingTimeout: 60000,
  cors: {
    origins: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-type'],
  },
  maxHttpBufferSize: 1e8,
  secure: true,
});

io.on('connection', (socket) => {
  console.log('connected to socket.io');
  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit('connected');
  });
  socket.on('join chat', (room) => {
    socket.join(room);
  });
  socket.on('typing', (_id, theirId) => {
    socket.in(theirId).emit('typing', _id);
  });
  socket.on('stop typing', (room) => {
    socket.in(room).emit('stop typing');
  });
  socket.on('new message', (newMessageReceived) => {
    var chat = newMessageReceived.chat;
    if (!chat.users) return;
    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;
      socket
        .in(user._id)
        .emit('message received', newMessageReceived, user._id);
    });
  });
  socket.on('new mass mail', (newMessageReceived) => {
    var chat = newMessageReceived.chat;
    if (!chat.users) return;
    socket.broadcast.emit('mass mail received', newMessageReceived);
  });
  socket.on('reorder users', (chats, _id, theirChats, theirId) => {
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
    socket.in(event.invitees.map((e) => e._id)).emit('event added', event);
  });
  socket.on('new gift card', (gift) => {
    socket.in(gift.to).emit('gift card added', gift);
  });

  socket.off('setup', () => {
    socket.leave(userData._id);
  });
});
