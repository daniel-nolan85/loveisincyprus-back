const User = require('../models/user');
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:customercare@loveisincyprus.com',
  process.env.WEB_PUSH_PUBLIC,
  process.env.WEB_PUSH_PRIVATE
);

exports.sendPushNotification = async (req, res) => {
  const { _id } = req.body;
  const user = await User.findById(_id).select('notifSubscription');

  if (user.notifSubscription && user.notifSubscription.subscription) {
    const subscription = user.notifSubscription.subscription;
    const payload = JSON.stringify(req.body.payload);
    console.log('subscription => ', subscription);
    console.log('payload => ', payload);
    webpush
      .sendNotification(subscription, payload)
      .then(() => {
        res.status(200).send('Push notification sent');
      })
      .catch((error) => {
        console.error('Error sending push notification:', error);
        res.status(500).send('Error sending push notification');
      });
  } else {
    res.status(400).send('Invalid subscription details');
  }
};
