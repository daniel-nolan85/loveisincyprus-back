const Coupon = require('../models/coupon');

exports.create = async (req, res) => {
  try {
    const { name, expiry, discount } = req.body.coupon;
    res.json(await new Coupon({ name, expiry, discount }).save());
  } catch (err) {
    console.log(err);
  }
};

exports.list = async (req, res) => {
  try {
    res.json(await Coupon.find({}).sort({ createdAt: -1 }).exec());
  } catch (err) {
    console.log(err);
  }
};

exports.remove = async (req, res) => {
  try {
    res.json(await Coupon.findByIdAndDelete(req.params.couponId).exec());
  } catch (err) {
    console.log(err);
  }
};

exports.update = async (req, res) => {
  console.log('update controller response => ', req.body);
  try {
    const { name, discount, expiry } = req.body.coupon;
    res.json(
      await Coupon.findByIdAndUpdate(
        { _id: req.params.couponId },
        { name, discount, expiry }
      ).exec()
    );
  } catch (err) {
    console.log(err);
  }
};

exports.deleteAfterUse = async (req, res) => {
  try {
    res.json(await Coupon.findByIdAndDelete(req.params.couponId).exec());
  } catch (err) {
    console.log(err);
  }
};

exports.deleteExpiredCoupon = async (req, res) => {
  try {
    res.json(
      await Coupon.deleteMany({ expiry: { $lte: new Date(Date.now()) } })
    );
  } catch (err) {
    console.log(err);
  }
};
