const Ad = require('../models/ad');
const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');
const nodemailer = require('nodemailer');

exports.submitAd = async (req, res) => {
  console.log('submitAd controller response => ', req.body);
  const { content, image, duration, demographic, contactInfo, accountInfo } =
    req.body;
  if (demographic.length === 0) {
    console.log('empty');
    demographic.push('everyone');
  }
  try {
    if (!content.length && !image.url) {
      res.json({
        error: 'Content is required',
      });
    }
    if (!contactInfo) {
      res.json({
        error: 'Contact info is required',
      });
    }
    if (!accountInfo) {
      res.json({
        error: 'Account info is required',
      });
    } else {
      const ad = new Ad({
        content,
        image,
        duration,
        demographic,
        contactInfo,
        accountInfo,
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
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchApprovedAds = async (req, res) => {
  try {
    const approved = await Ad.find({ status: 'approved' }).sort({
      createdAt: -1,
    });
    res.json(approved);
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

  let transporter = nodemailer.createTransport({
    host: 'mail.loveisincyprus.com',
    port: 465,
    auth: {
      user: 'loveisi3',
      pass: ']De*5YrqW62Dr4',
    },
    secure: true,
  });

  const content = reason
    ? `Your recent advertisement submission has been rejected for the following reason: ${reason}. You have not been charged. Feel free to re-try any time.`
    : 'Your recent advertisement submission has been rejected.  You have not been charged. Feel free to re-try any time.';

  let mailOptions = {
    from: 'customercare@loveisincyprus.com',
    to: ad.contactInfo.email,
    subject: 'Results of your recent ad submission to Love is in Cyprus',
    html: `
      <h3>Information</h3>
      <ul>
      <li>Name: ${ad.contactInfo.name}</li>
      <li>Email: ${ad.contactInfo.email}</li>
      </ul>

      <h3>Message</h3>
      <p>${content}</p>
      `,
  };

  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      res.send(err);
    } else {
      res.send('Success');
    }
  });
  transporter.close();
};

exports.approveAd = async (req, res) => {
  // console.log('approveAd controller response => ', req.body);
  const { ad } = req.body;
  const approveAd = await Ad.findByIdAndUpdate(
    ad._id,
    { status: 'approved' },
    { new: true }
  ).exec();

  let transporter = nodemailer.createTransport({
    host: 'mail.loveisincyprus.com',
    port: 465,
    auth: {
      user: 'loveisi3',
      pass: ']De*5YrqW62Dr4',
    },
    secure: true,
  });

  const content = `Your recent advertisement submission has been approved and will now be displayed to all members for ${ad.duration}.`;

  let mailOptions = {
    from: 'customercare@loveisincyprus.com',
    to: ad.contactInfo.email,
    subject: 'Results of your recent ad submission to Love is in Cyprus',
    html: `
      <h3>Information</h3>
      <ul>
      <li>Name: ${ad.contactInfo.name}</li>
      <li>Email: ${ad.contactInfo.email}</li>
      </ul>

      <h3>Message</h3>
      <p>${content}</p>
      `,
  };

  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      res.send(err);
    } else {
      res.send('Success');
    }
  });
  transporter.close();
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

exports.removeAd = async (req, res) => {
  try {
    res.json(await Ad.findByIdAndDelete(req.params.adId).exec());
  } catch (err) {
    console.log(err);
  }
};
