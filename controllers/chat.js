const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');
const MassMessage = require('../models/massMessages');
const nodemailer = require('nodemailer');
const axios = require('axios');
const mailchimp = require('@mailchimp/mailchimp_marketing');
const moment = require('moment');

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_KEY,
  server: 'us4',
});

// const list_id = process.env.MAILCHIMP_LIST_ID;
// const tag_name = 'tagged';

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

    const updateMessagesSent = await User.findOneAndUpdate(
      { _id },
      {
        $push: { messagesSent: { content, image, receiver: receiver._id } },
      },
      { new: true }
    );
    const updateMessagesReceived = await User.findOneAndUpdate(
      { _id: receiver._id },
      {
        $push: { messagesReceived: { content, image, sender: sender._id } },
      },
      { new: true }
    );
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
  const { image, content, selected } = req.body.massMail;

  if (!content || selected.length < 1 || !req.body.subject) {
    return res.sendStatus(400);
  }

  try {
    const sender = await User.findOne({
      _id: '63dc1d2a8eb01e4110743044',
    }).select('_id name username email profileImage');
    const chats = [];
    const userIds = selected.map((item) => item._id);
    const userEmails = selected.map((item) => item.email);

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

      await Chat.findByIdAndUpdate(chats[i]._id, {
        latestMessage: message,
      });
    }

    const massMessage = await MassMessage.create({ content, image });

    const currentDate = new Date();
    const timestamp = new Date().getTime();
    const daysThreshold = 7;
    const listsToDelete = [];

    const getLists = async () => {
      const response = await mailchimp.lists.getAllLists();
      return response.lists;
    };

    const getDaysSinceDate = (date) => {
      const timeDiff = Math.abs(currentDate.getTime() - date.getTime());
      return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    };

    const checkListForDeletion = async (list) => {
      const campaignsResponse = await mailchimp.campaigns.list({
        list_id: list.id,
        count: 1,
        sort_field: 'send_time',
        sort_dir: 'DESC',
      });

      if (campaignsResponse.campaigns.length === 0) {
        const listCreatedDate = new Date(list.date_created);
        const daysSinceCreation = getDaysSinceDate(listCreatedDate);

        if (daysSinceCreation > daysThreshold) {
          listsToDelete.push(list);
        }
      } else {
        const lastCampaignDate = new Date(
          campaignsResponse.campaigns[0].send_time
        );
        const daysSinceLastCampaign = getDaysSinceDate(lastCampaignDate);

        if (daysSinceLastCampaign > daysThreshold) {
          listsToDelete.push(list);
        }
      }
    };

    const deleteLists = async () => {
      const allLists = await getLists();

      for (const list of allLists) {
        await checkListForDeletion(list);
      }

      for (const listToDelete of listsToDelete) {
        await mailchimp.lists.deleteList(listToDelete.id);
      }
    };

    const createAndPopulateList = async () => {
      await deleteLists();

      const newListResponse = await mailchimp.lists.createList({
        name: `Love is in Cyprus - ${timestamp}`,
        contact: {
          company: 'Aquilion Limited',
          address1: 'Carewatch Barnet, Apex House',
          city: 'Grand Arcade',
          state: 'London',
          zip: 'N12 0EH',
          country: 'United Kingdom',
        },
        permission_reminder:
          'You are receiving this email because you have opted in to receive occasional updates from www.loveisincyprus.com',
        email_type_option: true,
        campaign_defaults: {
          from_name: 'Love Is In Cyprus',
          from_email: 'customercare@loveisincyprus.com',
          subject: 'Latest update from Love is in Cyprus',
          language: 'en',
        },
      });

      const newListId = newListResponse.id;

      for (const email of userEmails) {
        await mailchimp.lists.addListMember(newListId, {
          email_address: email,
          status: 'subscribed',
        });
      }

      const campaign = await mailchimp.campaigns.create({
        type: 'regular',
        recipients: {
          list_id: newListId,
        },
        settings: {
          subject_line: req.body.subject,
          from_name: 'Love Is In Cyprus',
          reply_to: 'customercare@loveisincyprus.com',
          from_email: 'customercare@loveisincyprus.com',
        },
      });

      const campaignContent = await mailchimp.campaigns.setContent(
        campaign.id,
        {
          html: `
        <div style="text-align: center">
        <img src="https://res.cloudinary.com/dg9blonbn/image/upload/v1684603773/logo_qinzhi.png" alt="logo" style="width: 100px; height: 100px; margin: 20px 0;">
        </div>
        ${content}${
            Object.keys(image).length !== 0
              ? `<img src="${image.url}" alt="Love is in Cyprus" style="max-width: 400px; height: auto;">`
              : ''
          }`,
        }
      );

      const sendCampaign = await mailchimp.campaigns.send(campaign.id);
    };

    createAndPopulateList();

    const sendNotif = await User.updateMany(
      { _id: { $in: userIds } },
      {
        $push: {
          messages: { sender: '63dc1d2a8eb01e4110743044' },
        },
      }
    );
    res.json(message);
  } catch (err) {
    console.error('Error updating audience:', err);
  }
};

exports.chatMatches = async (req, res) => {
  try {
    const user = await User.findById(req.body._id).select('matches');
    const matches = await User.find({ _id: user.matches })
      .select('_id name email username profileImage messages')
      .exec();
    const admin = await User.findById('63dc1d2a8eb01e4110743044')
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
    const userReporting = await User.findByIdAndUpdate(
      req.body._id,
      {
        $push: { 'reports.message': req.body.message },
      },
      { new: true }
    );

    const userReported = await User.findByIdAndUpdate(
      req.body.message.sender._id,
      {
        $push: { 'reported.message': req.body.message },
      },
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

exports.fetchAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: {
        $nin: ['63dc1d2a8eb01e4110743044'],
      },
    })
      .populate('users', '_id username name email profileImage')
      .populate('latestMessage');
    res.json(chats);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchMassMessages = async (req, res) => {
  try {
    const massMessages = await MassMessage.find({}).sort({ createdAt: -1 });
    res.json(massMessages);
  } catch (err) {
    console.log(err);
  }
};
