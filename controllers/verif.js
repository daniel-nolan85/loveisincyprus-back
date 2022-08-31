const Verif = require('../models/verif');
const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');

exports.submitVerif = async (req, res) => {
  console.log('submitVerif controller response => ', req.body);
  const { verifImg, user } = req.body;

  try {
    if (!verifImg.url) {
      res.json({
        error: 'Image is required',
      });
    } else {
      const verif = new Verif({
        image: verifImg,
        postedBy: user,
      });
      const userStatus = await User.findByIdAndUpdate(
        user._id,
        { verified: 'pending' },
        { new: true }
      );
      verif.save();
      res.json(verif);
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};

exports.fetchVerifs = async (req, res) => {
  try {
    const verifs = await Verif.find().populate(
      'postedBy',
      '_id name profileImage email'
    );
    res.json(verifs);
  } catch (err) {
    console.log(err);
  }
};

exports.disapproveVerif = async (req, res) => {
  console.log('disapproveVerif controller response => ', req.body);
  const { verif, reason } = req.body;
  const userStatus = await User.findByIdAndUpdate(
    verif.postedBy._id,
    { verified: 'false' },
    { new: true }
  ).exec();

  const content = reason
    ? `Your recent submission to become verified has been rejected for the following reason: ${reason}`
    : 'Your recent submission to become verified has been rejected';

  const sender = await User.findOne({ _id: '621f58d359389f13dcc05a71' });
  const chat = await Chat.findOne({
    users: { $size: 2, $all: [sender._id, verif.postedBy._id] },
  });
  var newMessage = {
    sender,
    content,
    chat,
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

    await Chat.findByIdAndUpdate(chat._id, {
      latestMessage: message,
    });
    res.json(message);
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
};

exports.approveVerif = async (req, res) => {
  //   console.log('approveVerif controller response => ', req.body);
  const { verif } = req.body;
  const userStatus = await User.findByIdAndUpdate(
    verif.postedBy._id,
    { verified: 'true' },
    { new: true }
  ).exec();

  const content = `Your recent submission to become verified has been approved and you will now have full access to all areas of the site`;

  const sender = await User.findOne({ _id: '621f58d359389f13dcc05a71' });
  const chat = await Chat.findOne({
    users: { $size: 2, $all: [sender._id, verif.postedBy._id] },
  });
  var newMessage = {
    sender,
    content,
    chat,
  };

  console.log('verif => ', verif);
  console.log('chat => ', chat);

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

    await Chat.findByIdAndUpdate(chat._id, {
      latestMessage: message,
    });
    res.json(message);
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
};
