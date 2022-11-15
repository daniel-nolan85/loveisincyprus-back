const Verif = require('../models/verif');
const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');
const cloudinary = require('cloudinary');
const nodemailer = require('nodemailer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

exports.submitVerif = async (req, res) => {
  console.log('submitVerif controller response => ', req.body);
  const { verifImg, user } = req.body;

  try {
    if (!verifImg) {
      res.json({
        error: 'Image is required',
      });
    } else {
      const result = await cloudinary.uploader.upload(req.body.verifImg);
      const verif = new Verif({
        image: result.secure_url,
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
    const verifs = await Verif.find()
      .populate('postedBy', '_id name profileImage email username')
      .sort({ createdAt: -1 });
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

  const pullVerif = await Verif.deleteOne({ postedBy: verif.postedBy._id });

  const content = reason
    ? `Your recent submission to become verified has been rejected for the following reason: ${reason}. You can re-try any time.`
    : 'Your recent submission to become verified has been rejected. You can re-try any time.';

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
    const sendNotif = await User.findByIdAndUpdate(
      verif.postedBy._id,
      { $push: { messages: { sender: sender._id } } },
      { new: true }
    );

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
  )
    .select('_id')
    .exec();

  const pullVerif = await Verif.deleteOne({ postedBy: verif.postedBy._id });

  const content = `Your recent submission to become verified has been approved. You have been awarded 80 points.`;

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

    const sendNotif = await User.findByIdAndUpdate(
      verif.postedBy._id,
      { $push: { messages: { sender: sender._id } } },
      { new: true }
    );

    await Chat.findByIdAndUpdate(chat._id, {
      latestMessage: message,
    });
    res.json({ userStatus, message });
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
};
