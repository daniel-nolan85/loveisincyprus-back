const Ad = require('../models/ad');
const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');

exports.submitAd = async (req, res) => {
  console.log('submitAd controller response => ', req.body);
  const { content, image, user, duration } = req.body;

  try {
    if (!content.length && !image.url) {
      res.json({
        error: 'Content is required',
      });
    } else {
      const ad = new Ad({
        content,
        image,
        postedBy: user,
        duration,
        status: 'pending',
      });
      ad.save();
      res.json(ad);
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};

exports.fetchAds = async (req, res) => {
  try {
    const ads = await Ad.find().populate(
      'postedBy',
      '_id name profileImage email'
    );
    res.json(ads);
  } catch (err) {
    console.log(err);
  }
};

exports.disapproveAd = async (req, res) => {
  console.log('disapproveAd controller response => ', req.body);
  const { ad, reason } = req.body;
  const rejectAd = await Ad.findByIdAndUpdate(
    ad._id,
    { status: 'rejected' },
    { new: true }
  ).exec();
  res.json(rejectAd);

  const content = reason
    ? `Your recent advertisement submission has been rejected for the following reason: ${reason}`
    : 'Your recent advertisement submission has been rejected';

  const sender = await User.findOne({ _id: '621f58d359389f13dcc05a71' });
  const chat = await Chat.findOne({ users: [sender._id, ad.postedBy._id] });
  var newMessage = {
    sender,
    content,
    chat: chat._id,
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
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
};

exports.approveAd = async (req, res) => {
  console.log('approveAd controller response => ', req.body);
  const { ad } = req.body;
  const approveAd = await Ad.findByIdAndUpdate(
    ad._id,
    { status: 'approved' },
    { new: true }
  ).exec();
  res.json(approveAd);

  const content = `Your recent advertisement submission has been approved and will now be displayed to all members for ${ad.duration}`;

  const sender = await User.findOne({ _id: '621f58d359389f13dcc05a71' });
  const chat = await Chat.findOne({ users: [sender._id, ad.postedBy._id] });
  var newMessage = {
    sender,
    content,
    chat: chat._id,
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
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
};
