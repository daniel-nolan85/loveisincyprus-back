const Order = require('../models/order');
const User = require('../models/user');
const Message = require('../models/message');
const Ad = require('../models/ad');
const Post = require('../models/post');
const Product = require('../models/product');
const nodemailer = require('nodemailer');

exports.orders = async (req, res) => {
  let allOrders = await Order.find({})
    .sort('-createdAt')
    .populate('products.product')
    .exec();
  res.json(allOrders);
};

exports.orderStatus = async (req, res) => {
  const { orderId, orderStatus } = req.body;

  let updated = await Order.findByIdAndUpdate(
    orderId,
    { orderStatus },
    { new: true }
  )
    .populate('products.product', 'title')
    .exec();

  res.json(updated);

  const email = await User.findById(updated.orderedBy).select('email');

  const listItems = updated.products.map((p) => {
    return `
      <tr>
        <td>${p.product.title}</td>
        <td>${p.price}</td>
        <td>${p.count}</td>
      </tr>`;
  });

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
  const filteredOptIns = optIns.filter(
    (u) => u._id != '63dc1d2a8eb01e4110743044'
  );
  res.json(filteredOptIns);
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
    res.json({ posts, comments, messages, content });
  } catch (err) {
    console.log(err);
  }
};

exports.approveComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
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

exports.setPreferences = async (req, res) => {
  const { preferences, secondaryAdmin } = req.body;
  try {
    if (preferences.includes('verified')) {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canVerify: true },
        { new: true }
      );
    } else {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canVerify: false },
        { new: true }
      );
    }
    if (preferences.includes('reported')) {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canReported: true },
        { new: true }
      );
    } else {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canReported: false },
        { new: true }
      );
    }
    if (preferences.includes('posts')) {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canPosts: true },
        { new: true }
      );
    } else {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canPosts: false },
        { new: true }
      );
    }
    if (preferences.includes('users')) {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canUsers: true },
        { new: true }
      );
    } else {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canUsers: false },
        { new: true }
      );
    }
    if (preferences.includes('mail')) {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canMassMail: true },
        { new: true }
      );
    } else {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canMassMail: false },
        { new: true }
      );
    }
    if (preferences.includes('events')) {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canEvents: true },
        { new: true }
      );
    } else {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canEvents: false },
        { new: true }
      );
    }
    if (preferences.includes('orders')) {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canOrders: true },
        { new: true }
      );
    } else {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canOrders: false },
        { new: true }
      );
    }
    if (preferences.includes('products')) {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canProducts: true },
        { new: true }
      );
    } else {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canProducts: false },
        { new: true }
      );
    }
    if (preferences.includes('categories')) {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canCategories: true },
        { new: true }
      );
    } else {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canCategories: false },
        { new: true }
      );
    }
    if (preferences.includes('subs')) {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canSubs: true },
        { new: true }
      );
    } else {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canSubs: false },
        { new: true }
      );
    }
    if (preferences.includes('coupon')) {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canCoupon: true },
        { new: true }
      );
    } else {
      const user = await User.findByIdAndUpdate(
        { _id: secondaryAdmin._id },
        { canCoupon: false },
        { new: true }
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

exports.fetchProductsForReview = async (req, res) => {
  try {
    const products = await Product.find({ approved: false }).select('_id');
    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchNewOrders = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: 'Not Processed' }).select(
      '_id'
    );
    res.json(orders);
  } catch (err) {
    console.log(err);
  }
};
