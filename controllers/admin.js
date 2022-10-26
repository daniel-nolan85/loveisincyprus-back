const Order = require('../models/order');
const User = require('../models/user');
const Message = require('../models/message');
const Ad = require('../models/ad');

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
  ).exec();
  res.json(updated);
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
