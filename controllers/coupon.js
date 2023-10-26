const Coupon = require('../models/coupon');

exports.create = async (req, res) => {
  console.log('create => ', req.body);
  try {
    const { name, selectedProducts, subscription, partner, expiry, discount } =
      req.body.coupon;
    res.json(
      await new Coupon({
        name,
        products: selectedProducts,
        subscription,
        partner,
        expiry,
        discount,
      }).save()
    );
  } catch (err) {
    console.log('error', err);
    res.json(err);
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
  try {
    const { name, selectedProducts, subscription, partner, discount, expiry } =
      req.body.coupon;
    res.json(
      await Coupon.findByIdAndUpdate(
        { _id: req.params.couponId },
        {
          name,
          products: selectedProducts,
          subscription,
          partner,
          discount,
          expiry,
        }
      ).exec()
    );
  } catch (err) {
    console.log(err);
  }
};

exports.handleAfterUse = async (req, res) => {
  const { cartTotal } = req.body;
  try {
    const coupon = await Coupon.findById(req.params.couponId);
    if (coupon.name.slice(0, 5) === 'GIFT-' && coupon.discount > cartTotal) {
      await Coupon.findByIdAndUpdate(req.params.couponId, {
        $inc: { discount: -cartTotal },
      });
      res.json(coupon);
    } else if (
      coupon.name.slice(0, 5) === 'GIFT-' &&
      coupon.discount < cartTotal
    ) {
      res.json(await Coupon.findByIdAndDelete(req.params.couponId).exec());
    } else {
      res.json(await Coupon.findByIdAndDelete(req.params.couponId).exec());
    }
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

exports.validateSubCoupon = async (req, res) => {
  console.log('validateSubCoupon => ', req.body);
  const { coupon } = req.body;
  const validCoupon = await Coupon.findOne({ name: coupon }).exec();
  if (validCoupon === null || !validCoupon.subscription) {
    return res.json({
      err: 'Invalid coupon',
    });
  }
  res.json(validCoupon);
};
