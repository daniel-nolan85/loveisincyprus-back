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
  const { email } = req.user;
  const adminUser = await User.findOne({ email }).exec();

  if (adminUser.role !== 'admin') {
    res.status(403).json({
      err: 'Admin resource. Access denied',
    });
  } else {
    next();
  }
};

exports.addFollower = async (req, res, next) => {
  // console.log('add follower middleware response => ', req.body);
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
  // console.log('removefollower req.body => ', req.body);
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
