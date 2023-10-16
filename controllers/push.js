const webpush = require('web-push');

webpush.setVapidDetails(
  'https://loveisincyprus.com',
  process.env.WEB_PUSH_PUBLIC,
  process.env.WEB_PUSH_PRIVATE
);

exports.sendPushNotification = async (req, res) => {
  const { endpoint, keys } = req.body;
  const subscription = { endpoint, keys };
  const payload = JSON.stringify(req.body.payload);

  webpush
    .sendNotification(subscription, payload)
    .then(() => {
      res.status(200).send('Push notification sent');
    })
    .catch((error) => {
      console.error('Error sending push notification:', error);
      res.status(500).send('Error sending push notification');
    });
};
