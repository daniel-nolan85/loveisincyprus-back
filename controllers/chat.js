const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');

exports.accessChat = async (req, res) => {
  const { _id, u } = req.body;

  if (!_id) {
    return res.sendStatus(400);
  }
  let isChat = await Chat.find({
    $and: [
      { users: { $elemMatch: { $eq: _id } } },
      { users: { $elemMatch: { $eq: u._id } } },
    ],
  })
    .populate('users', 'name username email profileImage')
    .populate('latestMessage');

  isChat = await User.populate(isChat, {
    path: 'latestMessage.sender',
    select: 'name username email profileImage',
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    const chatData = {
      users: [_id, u._id],
    };
    try {
      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        'users',
        'name username email profileImage'
      );
      res.status(200).send(fullChat);
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }
  }
};

exports.fetchChats = async (req, res) => {
  const { _id } = req.body;

  try {
    Chat.find({ users: { $elemMatch: { $eq: _id } } })
      .populate('users', '_id name email username profileImage messages')
      .populate('latestMessage')
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: 'latestMessage.sender',
          select: 'name username email profileImage messages',
        });
        res.status(200).send(results);
      });
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
};

exports.fetchTheirChats = async (req, res) => {
  const { theirId } = req.body;

  try {
    Chat.find({ users: { $elemMatch: { $eq: theirId } } })
      .populate('users', '_id name email username profileImage messages')
      .populate('latestMessage')
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: 'latestMessage.sender',
          select: 'name username email profileImage messages',
        });
        res.status(200).send(results);
      });
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
};

exports.sendMessage = async (req, res) => {
  const { _id, content, chatId, image } = req.body;

  if (!content || !chatId) {
    return res.sendStatus(400);
  }
  const sender = await User.findOne({ _id }).select(
    '_id name username email profileImage'
  );
  const chat = await Chat.findOne({ _id: chatId });
  var newMessage = {
    sender,
    content,
    chat,
    image,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate(
      'sender',
      'name username email profileImage'
    );
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name username email profileImage',
    });
    const receiver = chat.users.find((u) => u._id != _id);

    const sendNotif = await User.findByIdAndUpdate(
      receiver._id,
      { $push: { messages: { sender: _id } } },
      { new: true }
    );

    const updateLatest = await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });
    res.json(message);
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
};

exports.allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name username email profileImage')
      .populate('chat');
    res.json(messages);
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
};

exports.massMail = async (req, res) => {
  const { image, content, selected } = req.body;

  if (!content || selected.length < 1) {
    return res.sendStatus(400);
  }

  const sender = await User.findOne({ _id: '63daf9a0a6fba9776c394db5' }).select(
    '_id name username email profileImage'
  );
  const userIds = [];
  const chats = [];

  for (var i = 0; i < selected.length; i++) {
    userIds.push(selected[i]._id);
  }

  for (var i = 0; i < userIds.length; i++) {
    const chat = await Chat.findOne({
      users: { $size: 2, $all: [sender._id, userIds[i]] },
    });
    chats.push(chat);
  }

  for (var i = 0; i < chats.length; i++) {
    var newMessage = {
      sender,
      content,
      chat: chats[i],
      image,
    };
    var message = await Message.create(newMessage);
    message = await message.populate(
      'sender',
      'name username email profileImage'
    );
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name username email profileImage',
    });

    const sendNotif = await User.updateMany(
      { _id: { $in: userIds } },
      { $push: { messages: { sender: sender._id } } }
    );

    await Chat.findByIdAndUpdate(chats[i]._id, {
      latestMessage: message,
    });
    res.json(message);
  }
};

exports.chatMatches = async (req, res) => {
  try {
    const user = await User.findById(req.body._id).select('matches');
    const matches = await User.find({ _id: user.matches })
      .select('_id name email username profileImage messages')
      .exec();
    const admin = await User.findById('63daf9a0a6fba9776c394db5')
      .select('_id name email username profileImage messages')
      .exec();
    const usersToChat = matches.concat(admin);
    res.json(usersToChat);
  } catch (err) {
    console.log('userMatches => ', err);
  }
};

exports.markRead = async (req, res) => {
  const { _id, u } = req.body;
  const markAsRead = await User.findOneAndUpdate(
    { _id },
    { $pull: { messages: { sender: u._id } } },
    { new: true }
  ).select('messages');
  res.json(markAsRead);
};

exports.reportMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { reported: true },
      { new: true }
    );

    res.json(message);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchReportedMessages = async (req, res) => {
  try {
    const messages = await Message.find({ reported: true })
      .populate('sender', '_id name email profileImage username mobile')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.log(err);
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.messageId);
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};
