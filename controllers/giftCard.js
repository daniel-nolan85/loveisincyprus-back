const GiftCard = require('../models/giftCard');
const User = require('../models/user');
const Coupon = require('../models/coupon');

exports.sendCard = async (req, res) => {
  const { greeting, image, message, amount, succeeded, from, to, couponCode } =
    req.body;
  const now = new Date();
  const expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    if (!greeting.length) {
      res.json({
        error: 'Greeting is required',
      });
    }
    if (!message) {
      res.json({
        error: 'Message is required',
      });
    }
    if (!amount) {
      res.json({
        error: 'Amount is required',
      });
    }
    if (!succeeded) {
      res.json({
        error: 'Payment is required',
      });
    } else {
      const giftCard = new GiftCard({
        greeting,
        image,
        message,
        amount,
        succeeded,
        from,
        to,
        expiry,
        couponCode,
      });
      giftCard.save();
      res.json(giftCard);
      const findFrom = await User.findById(from).select(
        '_id name username email profileImage'
      );
      const notify = await User.findByIdAndUpdate(
        to,
        {
          $push: {
            notifications: {
              notif: {
                giftCard,
                name: findFrom.name,
                username: findFrom.username,
                email: findFrom.email,
                profileImage: findFrom.profileImage,
              },
              action: 'new gift card',
            },
          },
        },
        { new: true }
      ).populate('notif');
      const sendNotif = await User.findByIdAndUpdate(
        to,
        {
          $addToSet: {
            newNotifs: {
              action: 'You have been sent a gift card',
              id: giftCard._id,
            },
          },
        },
        { new: true }
      );
      const createCoupon = await new Coupon({
        name: couponCode,
        expiry,
        discount: amount,
      }).save();

      const updateFrom = await User.findByIdAndUpdate(
        from,
        {
          $inc: { giftCardsSent: 1, giftCardsSentValue: amount },
        },
        { new: true }
      );
      const updateTo = await User.findByIdAndUpdate(
        to,
        {
          $inc: { giftCardsReceived: 1, giftCardsReceivedValue: amount },
        },
        { new: true }
      );
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};

exports.fetchCardsReceived = async (req, res) => {
  const received = await GiftCard.find({ to: req.body._id }).populate(
    'from',
    '_id name username email profileImage'
  );
  res.json(received);
};

exports.fetchCardsSent = async (req, res) => {
  const sent = await GiftCard.find({ from: req.body._id });
  res.json(sent);
};
