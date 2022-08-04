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

exports.fetchApprovedAds = async (req, res) => {
  try {
    const approved = await Ad.find({ status: 'approved' }).populate(
      'postedBy',
      '_id name profileImage email'
    );
    res.json(approved);
  } catch (err) {
    console.log(err);
  }
};

exports.disapproveAd = async (req, res) => {
  // console.log('disapproveAd controller response => ', req.body);
  const { ad, reason } = req.body;
  const rejectAd = await Ad.findByIdAndUpdate(
    ad._id,
    { status: 'rejected' },
    { new: true }
  ).exec();

  const content = reason
    ? `Your recent advertisement submission has been rejected for the following reason: ${reason}`
    : 'Your recent advertisement submission has been rejected';

  const sender = await User.findOne({ _id: '621f58d359389f13dcc05a71' });
  const chat = await Chat.findOne({ users: [sender._id, ad.postedBy._id] });
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

exports.approveAd = async (req, res) => {
  // console.log('approveAd controller response => ', req.body);
  const { ad } = req.body;
  const approveAd = await Ad.findByIdAndUpdate(
    ad._id,
    { status: 'approved' },
    { new: true }
  ).exec();

  const content = `Your recent advertisement submission has been approved and will now be displayed to all members for ${ad.duration}`;

  const sender = await User.findOne({ _id: '621f58d359389f13dcc05a71' });
  const chat = await Chat.findOne({ users: [sender._id, ad.postedBy._id] });
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

exports.handleExpiredAds = async (req, res) => {
  console.log('handleExpiredAds');
  const ids = [];
  const expiredOneDay = await Ad.find({
    $and: [
      { status: 'approved' },
      { duration: 'one day' },
      {
        updatedAt: {
          $lt: new Date(Date.now() - 24 * 3600 * 1000),
        },
      },
    ],
  });
  expiredOneDay.map((u) => {
    ids.push(u._id);
  });
  const expiredOneWeek = await Ad.find({
    $and: [
      { status: 'approved' },
      { duration: 'one week' },
      {
        updatedAt: {
          $lt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        },
      },
    ],
  });
  expiredOneWeek.map((u) => {
    ids.push(u._id);
  });
  const expiredTwoWeeks = await Ad.find({
    $and: [
      { status: 'approved' },
      { duration: 'two weeks' },
      {
        updatedAt: {
          $lt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
        },
      },
    ],
  });
  expiredTwoWeeks.map((u) => {
    ids.push(u._id);
  });
  const expiredOneMonth = await Ad.find({
    $and: [
      { status: 'approved' },
      { duration: 'one month' },
      {
        updatedAt: {
          $lt: new Date(Date.now() - 31 * 24 * 3600 * 1000),
        },
      },
    ],
  });
  expiredOneMonth.map((u) => {
    ids.push(u._id);
  });

  const handleExpired = await Ad.updateMany(
    {
      _id: { $in: ids },
    },
    {
      $set: { status: 'expired' },
    },
    { new: true }
  ).exec();

  res.json({ ok: true });
};
