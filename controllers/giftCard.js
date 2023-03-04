const GiftCard = require('../models/giftCard');

exports.sendCard = async (req, res) => {
  console.log('sendcard controller response => ', req.body);
  const { greeting, image, message, amount, paid } = req.body;

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
    if (!paid) {
      res.json({
        error: 'Payment is required',
      });
    } else {
      const giftCard = new GiftCard({
        greeting,
        image,
        message,
        amount,
        paid,
      });
      giftCard.save();
      res.json(giftCard);
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};
