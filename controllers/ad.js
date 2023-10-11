const Ad = require('../models/ad');
const nodemailer = require('nodemailer');

exports.submitAd = async (req, res) => {
  const {
    hyperlink,
    content,
    image,
    duration,
    demographic,
    contactInfo,
    authId,
  } = req.body;
  if (demographic.length === 0) {
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
    if (!authId) {
      res.json({
        error: 'Payment details are required',
      });
    } else {
      const ad = new Ad({
        hyperlink,
        content,
        image,
        duration,
        demographic,
        contactInfo,
        status: 'pending',
        authId,
      });
      ad.save();

      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'customercare@loveisincyprus.com',
          pass: process.env.GMAIL_AUTHORIZATION,
        },
        secure: true,
      });

      let emailAdmin = {
        from: 'customercare@loveisincyprus.com',
        to: 'william.wolf@mac.com',
        subject: 'New ad submission was placed on Love is in Cyprus',
        html: `
        <h3 style="margin-bottom: 5px;">You have received a new ad submission to review</h3>
      `,
      };

      let emailUser = {
        from: 'customercare@loveisincyprus.com',
        to: contactInfo.email,
        subject:
          'Confirmation of your recent ad submission to Love is in Cyprus',
        html: `
        <h3 style="margin-bottom: 5px;">Thank you for submitting your recent advertisement submission.</h3>
        <p>Your content will shortly be reviewed by our admin team and, if approved, we will then run your payment. Your advertisement will be then displayed on our site to your chosen demographic as soon as your payment has cleared.</p>
      `,
      };

      const emails = [emailAdmin, emailUser];

      for (let i = 0; i < emails.length; i++) {
        transporter.sendMail(emails[i], (err, response) => {
          if (err) {
            res.send(err);
          } else {
            res.send('Success');
          }
        });
      }

      transporter.close();

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

exports.fetchPaidAds = async (req, res) => {
  try {
    const paid = await Ad.find({ status: 'paid' }).sort({
      createdAt: -1,
    });
    res.json(paid);
  } catch (err) {
    console.log(err);
  }
};

exports.disapproveAd = async (req, res) => {
  const { ad, reason } = req.body;
  res.json(await Ad.findByIdAndDelete(ad._id).exec());

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'customercare@loveisincyprus.com',
      pass: process.env.GMAIL_AUTHORIZATION,
    },
    secure: true,
  });

  const content = reason
    ? `<p>Your recent advertisement submission has been rejected for the following reason:</p>
    <p>${reason}</p>
    <p>Your funds will be returned to you via PayPal. Please note that it typically takes 1-5 business days for PayPal to release funds, however it can take longer in some cases. If you have not received your funds within 30 days please contact PayPal support for assistance.</p>
    <p>You are welcome to to re-try with a new submission at any time.</p>`
    : `Your recent advertisement submission has been rejected.</p>
    <p>Your funds will be returned to you via PayPal. Please note that it typically takes 1-5 business days for PayPal to release funds, however it can take longer in some cases. If you have not received your funds within 30 days please contact PayPal support for assistance.</p>
    <p>You are welcome to to re-try with a new submission at any time.</p>`;

  let mailOptions = {
    from: 'customercare@loveisincyprus.com',
    to: ad.contactInfo.email,
    subject: 'Results of your recent ad submission to Love is in Cyprus',
    html: `
      ${content}
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
  const { ad } = req.body;
  const approveAd = await Ad.findByIdAndUpdate(
    ad._id,
    { status: 'paid' },
    { new: true }
  ).exec();

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'customercare@loveisincyprus.com',
      pass: process.env.GMAIL_AUTHORIZATION,
    },
    secure: true,
  });

  let mailOptions = {
    from: 'customercare@loveisincyprus.com',
    to: ad.contactInfo.email,
    subject: 'Results of your recent ad submission to Love is in Cyprus',
    html: `
      <h3 style="margin-bottom: 5px;">Congratulations! Your recent advertisement submission has been approved.</h3>
      <p>Your payment has been successfully completed and your ad will now be displayed on our site to your chose demographic for ${ad.duration}.
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
  const ids = [];
  const expiredOneDay = await Ad.find({
    $and: [
      { status: 'paid' },
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
      { status: 'paid' },
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
      { status: 'paid' },
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
      { status: 'paid' },
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

exports.checkAd = async (req, res) => {
  const ad = await Ad.findById(req.body.ad._id).select('status');
  res.json(ad);
};
