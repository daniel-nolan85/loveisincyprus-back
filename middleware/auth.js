const admin = require('../firebase');
const User = require('../models/user');

exports.authCheck = async (req, res, next) => {
  try {
    const firebaseUser = await admin
      .auth()
      .verifyIdToken(req.headers.authtoken);
    req.user = firebaseUser;
    next();
  } catch (err) {
    res.status(401).json({
      err: 'Invalid or expired token',
    });
  }
};

exports.adminCheck = async (req, res, next) => {
  console.log('adminCheck');
  const adminUser = await User.findOne({
    mobile: req.user.phone_number,
  }).exec();

  if (adminUser.role === 'subscriber') {
    res.status(403).json({
      err: 'Admin resource. Access denied',
    });
  } else {
    next();
  }
};

exports.subscriberCheck = async (req, res, next) => {
  const subscriber = await User.findOne({
    mobile: req.user.phone_number,
  }).exec();

  if (subscriber.membership.paid === false) {
    res.status(403).json({
      err: 'Paid resource. Access denied',
    });
  } else {
    next();
  }
};

exports.eligibleForRefund = async (req, res, next) => {
  const eligible = await User.findOne({ mobile: req.user.phone_number }).exec();

  if (eligible.membership.trialPeriod === false) {
    res.status(403).json({
      err: 'Trial period expired. Access denied',
    });
  } else {
    next();
  }
};

exports.addFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.body.u._id,
      {
        $addToSet: { followers: req.body.user._id },
      },
      { new: true }
    );
    next();
  } catch (err) {
    console.log(err);
  }
};

exports.removeFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.body.u._id,
      {
        $pull: { followers: req.body.user._id },
      },
      { new: true }
    );
    next();
  } catch (err) {
    console.log(err);
  }
};
