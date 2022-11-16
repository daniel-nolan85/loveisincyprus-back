const Order = require('../models/order');
const User = require('../models/user');
const Message = require('../models/message');
const Ad = require('../models/ad');
const Post = require('../models/post');
const nodemailer = require('nodemailer');

exports.orders = async (req, res) => {
  let allOrders = await Order.find({})
    .sort('-createdAt')
    .populate('products.product')
    .exec();
  res.json(allOrders);
};

exports.orderStatus = async (req, res) => {
  console.log('orderStatus controller response => ', req.body);
  const { orderId, orderStatus } = req.body;

  let updated = await Order.findByIdAndUpdate(
    orderId,
    { orderStatus },
    { new: true }
  )
    .populate('products.product', 'title')
    .exec();
  console.log('updated => ', updated);

  res.json(updated);

  const email = await User.findById(updated.orderedBy).select('email');
  console.log('email => ', email);

  const listItems = updated.products.map((p) => {
    return `
      <tr>
        <td>${p.product.title}</td>
        <td>${p.price}</td>
        <td>${p.count}</td>
      </tr>`;
  });

  let transporter = nodemailer.createTransport({
    host: 'mail.loveisincyprus.com',
    port: 465,
    auth: {
      user: 'loveisi3',
      pass: ']De*5YrqW62Dr4',
    },
    secure: true,
  });

  let mailOptions = {
    from: 'customercare@loveisincyprus.com',
    to: email.email,
    subject: 'Order update from Love is in Cyprus',
    html: `
      <h3 style="margin-bottom: 5px;">The status of your recent order has just been updated</h3>
      <p style="margin-bottom: 5px;">Order ID: <span style="font-weight: bold">${
        updated._id
      }</span></p>
      <table style="border-spacing: 20px; border-collapse: separate; margin-bottom: 5px;">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          ${listItems}
        </tbody>
      </table>
      <p style='margin-bottom: 5px;'>
            Discount: ${
              updated.discount
                ? '€' + updated.discount.toFixed(2)
                : 'No coupon applied'
            }
      </p>
      <p style="margin-bottom: 5px;">${
        updated.deliveryFee &&
        'Delivery fee: €' + updated.deliveryFee.toFixed(2)
      }</p>
      <h3 style="margin-bottom: 5px;">${
        'Total: €' + updated.paymentIntent.amount
      }</h3>

      <p style="font-size: 18px; margin-bottom: 5px;">The status of your order is currently <span style="font-weight: bold;">${
        updated.orderStatus
      }</span>. We'll continue to notify you as this updates.</p>
      <h3>Thank you for shopping with us</h3>
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

exports.fetchOptIns = async (req, res) => {
  const optIns = await User.find({ optIn: true }).select(
    'optIn _id name email username profileImage pointsGained pointsLost pointsSpent featuredMember'
  );
  res.json(optIns);
};

exports.totalMessages = async (req, res) => {
  try {
    const total = await Message.find().estimatedDocumentCount();
    res.json(total);
  } catch (err) {
    console.log(err);
  }
};

exports.incomeTaken = async (req, res) => {
  const orders = await Order.find({
    'paymentIntent.status': { $regex: 'approved' },
  });

  let sumOfOrders = 0;
  orders.map((order) => {
    let amount = parseFloat(order.paymentIntent.amount);
    sumOfOrders += amount;
  });

  const subscriptions = await User.find({
    'membership.trialPeriod': false,
  }).select('membership');

  let sumOfSubscriptions = 0;
  subscriptions.map((subscription) => {
    let amount = parseFloat(subscription.membership.cost);
    sumOfSubscriptions += amount;
  });

  const income = parseFloat(sumOfOrders) + parseFloat(sumOfSubscriptions);

  res.json(income);
};

exports.fetchNewAds = async (req, res) => {
  try {
    const pending = await Ad.find({ status: 'pending' }).select('_id');
    res.json(pending);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchNewVerifs = async (req, res) => {
  try {
    const pending = await User.find({ verified: 'pending' }).select('_id');
    res.json(pending);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchReportedContent = async (req, res) => {
  try {
    const posts = await Post.find({ reported: true }).select('_id');
    const comments = await Post.aggregate([
      { $unwind: '$comments' },
      { $match: { 'comments.reported': true } },
      { $project: { 'comments._id': 1 } },
    ]);
    const messages = await Message.find({ reported: true }).select('_id');
    const content = posts.concat(comments, messages);
    console.log('content => ', content);
    res.json({ posts, comments, messages, content });
  } catch (err) {
    console.log(err);
  }
};

exports.approveComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    console.log('reportComment controller response', postId, comment);
    const post = await Post.findOneAndUpdate(
      {
        _id: postId,
        'comments._id': comment._id,
      },
      {
        $set: { 'comments.$.reported': false },
      },
      { new: true }
    );
    console.log('post => ', post);
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.approvePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { reported: false },
      { new: true }
    );

    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.approveMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { reported: false },
      { new: true }
    );

    res.json(message);
  } catch (err) {
    console.log(err);
  }
};
