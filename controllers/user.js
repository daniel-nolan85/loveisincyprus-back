const nodemailer = require('nodemailer');
const User = require('../models/user');
const Post = require('../models/post');
const Product = require('../models/product');
const Cart = require('../models/cart');
const Coupon = require('../models/coupon');
const Order = require('../models/order');
const Event = require('../models/event');
const axios = require('axios');

exports.recaptcha = async (req, res) => {
  // console.log('recaptcha controller response => ', req.body);
  const { secret, token } = req.body;

  await axios
    .post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`
    )
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.contactFormEmail = (req, res) => {
  const { name, email, subject, message } = req.body.values;

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    auth: {
      user: 'loveisincyprus@gmail.com',
      pass: 'revamp22',
    },
    secure: true,
  });

  let mailOptions = {
    from: email,
    to: 'loveisincyprus@gmail.com',
    subject: subject,
    html: `
      <h3>Information</h3>
      <ul>
      <li>Name: ${name}</li>
      <li>Email: ${email}</li>
      </ul>

      <h3>Message</h3>
      <p>${message}</p>
      `,
  };

  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      res.send(err);
    } else {
      res.send('Success');
    }
  });
  // transporter.close();
};

exports.usersPhotos = async (req, res) => {
  // console.log('usersPhotos controller response => ', req.body);
  try {
    const photos = [];
    const user = await User.findById(req.body.userId);
    if (user.profilePhotos) {
      photos.push(user.profilePhotos);
    }
    if (user.coverPhotos) {
      photos.push(user.coverPhotos);
    }
    if (user.uploadedPhotos) {
      photos.push(user.uploadedPhotos);
    }
    res.json(photos);
  } catch (err) {
    console.log(err);
  }
};

exports.visitorPhotos = async (req, res) => {
  // console.log('visitorPhotos controller response => ', req.body);
  try {
    const photos = [];
    const user = await User.findById(req.body.user._id);
    if (user.profilePhotos) {
      photos.push(user.profilePhotos);
    }
    if (user.coverPhotos) {
      photos.push(user.coverPhotos);
    }
    if (user.uploadedPhotos) {
      photos.push(user.uploadedPhotos);
    }
    let merged = [].concat.apply([], photos);
    let total = merged.length;
    // console.log('visitorPhotos controller response => ', merged);

    res.json(total);
  } catch (err) {
    console.log(err);
  }
};

exports.userCart = async (req, res) => {
  const { cart } = req.body;
  let products = [];
  const user = await User.findOne({ email: req.user.email }).exec();
  let cartExistByThisUser = await Cart.findOne({ orderedBy: user._id }).exec();

  if (cartExistByThisUser) {
    cartExistByThisUser.remove();
    console.log('removed old cart');
  }
  for (let i = 0; i < cart.length; i++) {
    let object = {};
    object.product = cart[i]._id;
    object.count = cart[i].count;
    let productFromDb = await Product.findById(cart[i]._id)
      .select('price')
      .exec();
    object.price = productFromDb.price;
    products.push(object);
  }
  console.log('products', products);

  let cartTotal = 0;
  for (let i = 0; i < products.length; i++) {
    cartTotal = cartTotal + products[i].price * products[i].count;
  }
  console.log('cartTotal', cartTotal);

  let newcart = await new Cart({
    products,
    cartTotal,
    orderedBy: user._id,
  }).save();
  console.log('newcart', newcart);

  res.json({ ok: true });
};

exports.getUserCart = async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).exec();
  let cart = await Cart.findOne({ orderedBy: user._id })
    .populate('products.product')
    .exec();

  const { products, cartTotal, totalAfterDiscount } = cart;
  res.json({ products, cartTotal, totalAfterDiscount });
};

exports.emptyCart = async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).exec();
  const cart = await Cart.findOneAndRemove({ orderedBy: user._id }).exec();
  res.json(cart);
};

exports.saveAddress = async (req, res) => {
  // console.log('saveAddress controller response => ', req.body);
  const userAddress = await User.findOneAndUpdate(
    { email: req.user.email },
    { address: req.body.address }
  ).exec();
  res.json({ ok: true });
};

exports.applyCouponToUserCart = async (req, res) => {
  const { coupon } = req.body;
  console.log('applyCouponToUserCart controller response', coupon);
  const validCoupon = await Coupon.findOne({ name: coupon }).exec();
  if (validCoupon === null) {
    return res.json({
      err: 'Invalid coupon',
    });
  }
  console.log('VALID COUPON', validCoupon);
  const user = await User.findOne({ email: req.user.email }).exec();
  let { products, cartTotal } = await Cart.findOne({ orderedBy: user._id })
    .populate('products.product', '_id title price')
    .exec();
  console.log('cartTotal', cartTotal, 'discount', validCoupon.discount);

  let totalAfterDiscount = (
    cartTotal -
    (cartTotal * validCoupon.discount) / 100
  ).toFixed(2);

  Cart.findOneAndUpdate(
    { orderedBy: user._id },
    { totalAfterDiscount },
    { new: true }
  ).exec();
  res.json(totalAfterDiscount);
};

exports.createOrder = async (req, res) => {
  const { paymentIntent } = req.body.stripeResponse;
  const user = await User.findOne({ email: req.user.email }).exec();
  let { products } = await Cart.findOne({ orderedBy: user._id }).exec();

  let newOrder = await new Order({
    products,
    paymentIntent,
    orderedBy: user._id,
  }).save();

  let bulkOption = products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product._id },
        update: { $inc: { quantity: -item.count, sold: +item.count } },
      },
    };
  });

  let updated = await Product.bulkWrite(bulkOption, {});
  console.log('product quantity-- and sold ++', updated);

  console.log('new order saved', newOrder);
  res.json({ ok: true });
};

exports.orders = async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).exec();
  const userOrders = await Order.find({ orderedBy: user._id })
    .populate('products.product')
    .exec();
  res.json(userOrders);
};

exports.addToWishlist = async (req, res) => {
  const { productId } = req.body;
  const user = await User.findOneAndUpdate(
    { email: req.user.email },
    { $addToSet: { wishlist: productId } }
  ).exec();
  res.json({ ok: true });
};

exports.wishlist = async (req, res) => {
  const list = await User.findOne({ email: req.user.email })
    .select('wishlist')
    .populate('wishlist')
    .exec();
  res.json(list);
};

exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  const user = await User.findOneAndUpdate(
    { email: req.user.email },
    { $pull: { wishlist: productId } }
  ).exec();
  res.json({ ok: true });
};

exports.getUserPointsTotal = async (req, res) => {
  const numberToAdd = await User.findOne({ email: req.user.email }).select(
    'pointsGained'
  );
  const numberToRemove = await User.findOne({ email: req.user.email }).select(
    'pointsLost'
  );
  // numberToAdd.pointsGained.reduce((accumulator, object) => {
  //   return accumulator + object.amount;
  // }, 0);
  // numberToRemove.pointsLost.reduce((accumulator, object) => {
  //   return accumulator + object.amount;
  // }, 0);
  const total =
    numberToAdd.pointsGained.reduce((accumulator, object) => {
      return accumulator + object.amount;
    }, 0) -
    numberToRemove.pointsLost.reduce((accumulator, object) => {
      return accumulator + object.amount;
    }, 0);
  // console.log('getUserPoints controller response => ', numberToAdd);
  // console.log('getUserPoints controller response => ', numberToRemove);
  // console.log('getUserPoints controller response => ', total);
  res.json(total);
};

exports.addPoints = async (req, res) => {
  // console.log('addPoints controller response => ', req.body);
  // console.log('addPoints controller response => ', req.user);
  try {
    const { number, reason, otherUser } = req.body;
    const recentLogIn = await User.find({
      $and: [
        {
          email: req.user.email,
          'pointsGained.reason': 'login',
          'pointsGained.awarded': {
            $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      ],
    });
    if (reason === 'login' && recentLogIn.length > 0) return;

    if (reason === 'new visitor') {
      const awardOtherUserPoints = await User.findOneAndUpdate(
        { email: otherUser.email },
        {
          $push: { pointsGained: { amount: number, reason } },
        },
        { new: true }
      ).exec();
      res.json(awardOtherUserPoints);
      return;
    }

    const awardPoints = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $push: { pointsGained: { amount: number, reason } },
      },
      { new: true }
    ).exec();
    res.json(awardPoints);
  } catch (err) {
    console.log(err);
  }
};

exports.removePoints = async (req, res) => {
  // console.log('addPoints controller response => ', req.body);
  // console.log('addPoints controller response => ', req.user);
  try {
    const { number, reason } = req.body;
    const removePoints = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $push: { pointsLost: { amount: number, reason } },
      },
      { new: true }
    ).exec();
    res.json(removePoints);
  } catch (err) {
    console.log(err);
  }
};

exports.getUserPointsGainedData = async (req, res) => {
  const data = await User.findOne({ email: req.user.email })
    .select('pointsGained')
    .populate('pointsGained')
    .exec();
  // console.log('getUserPointsData total controller response => ', data);
  res.json(data);
};

exports.getUserPointsLostData = async (req, res) => {
  const data = await User.findOne({ email: req.user.email })
    .select('pointsLost')
    .populate('pointsLost')
    .exec();
  // console.log('getUserPointsData total controller response => ', data);
  res.json(data);
};

exports.fetchNotifications = async (req, res) => {
  // console.log('fetchNotifications controller response => ', req.body);
  try {
    const notifications = await User.findOne({ _id: req.body.user._id }).select(
      'notifications'
    );

    res.json(notifications);
  } catch (err) {
    console.log(err);
  }
};

exports.populateNotifications = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.user._id }).select(
      'notifications'
    );
    let postIds = [];
    user.notifications.map((n) => {
      n.action === 'liked post' && postIds.push(n.notif);
      n.action === 'commented post' && postIds.push(n.notif);
    });

    var obj_ids = postIds.map(function (id) {
      return id;
    });
    const posts = await Post.find({ _id: { $in: obj_ids } })
      .populate('likes', '_id name email profileImage')
      .populate('comments.postedBy', '_id name email profileImage');

    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.markNotifAsRead = async (req, res) => {
  // console.log('markNotifAsRead controller response => ', req.body);
  const notif = await User.findOneAndUpdate(
    { email: req.user.email, 'notifications._id': req.body.n._id },
    { $set: { 'notifications.$.new': 'false' } }
  );
  res.json({ ok: true });
};

exports.acceptInvite = async (req, res) => {
  console.log('acceptInvite controller response => ', req.body);
  try {
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $addToSet: { events: req.body.post.notif },
      }
    );
    const event = await Event.findOneAndUpdate(
      {
        _id: req.body.post.notif._id,
      },
      {
        $pull: { maybe: req.body.user._id, declined: req.body.user._id },
        $addToSet: { accepted: req.body.user._id },
      }
    ).populate('accepted', '_id name email profileImage');
    const notification = await User.findOneAndUpdate(
      {
        email: req.user.email,
        'notifications._id': req.body.post._id,
      },
      {
        $pull: {
          'notifications.$.notif.maybe': { _id: req.body.user._id },
          'notifications.$.notif.declined': { _id: req.body.user._id },
        },
        $addToSet: { 'notifications.$.notif.accepted': req.body.user },
      }
    );
    // const isGoing = await User.findOneAndUpdate(
    //   {
    //     email: req.user.email,
    //     'events._id': req.body.post.notif._id,
    //   },
    //   { $set: { 'events.$.going': 'yes' } }
    // );
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

exports.maybe = async (req, res) => {
  console.log('maybe controller response => ', req.body);
  try {
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $addToSet: { events: req.body.post.notif },
      }
    );
    const event = await Event.findOneAndUpdate(
      {
        _id: req.body.post.notif._id,
      },
      {
        $pull: { accepted: req.body.user._id, declined: req.body.user._id },
        $addToSet: { maybe: req.body.user._id },
      }
    ).populate('maybe', '_id name email profileImage');
    const notification = await User.findOneAndUpdate(
      {
        email: req.user.email,
        'notifications._id': req.body.post._id,
      },
      {
        $pull: {
          'notifications.$.notif.accepted': { _id: req.body.user._id },
          'notifications.$.notif.declined': { _id: req.body.user._id },
        },
        $addToSet: { 'notifications.$.notif.maybe': req.body.user },
      }
    );
    // const isGoing = await User.findOneAndUpdate(
    //   {
    //     email: req.user.email,
    //     'events._id': req.body.post.notif._id,
    //   },
    //   { $set: { 'events.$.going': 'maybe' } }
    // );
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

exports.declineInvite = async (req, res) => {
  console.log('decline controller response => ', req.body);
  try {
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      {
        $addToSet: { events: req.body.post.notif },
      }
    );
    const event = await Event.findOneAndUpdate(
      {
        _id: req.body.post.notif._id,
      },
      {
        $pull: { accepted: req.body.user._id, maybe: req.body.user._id },
        $addToSet: { declined: req.body.user._id },
      }
    ).populate('declined', '_id name email profileImage');
    const notification = await User.findOneAndUpdate(
      {
        email: req.user.email,
        'notifications._id': req.body.post._id,
      },
      {
        $pull: {
          'notifications.$.notif.accepted': { _id: req.body.user._id },
          'notifications.$.notif.maybe': { _id: req.body.user._id },
        },
        $addToSet: { 'notifications.$.notif.declined': req.body.user },
      }
    );
    // const isGoing = await User.findOneAndUpdate(
    //   {
    //     email: req.user.email,
    //     'events._id': req.body.post.notif._id,
    //   },
    //   { $set: { 'events.$.going': 'no' } }
    // );
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

// exports.deleteNotification = async (req, res) => {
//   const n = req.body.n.notif;
//   console.log('deleteNotification controller response => ', n);
//   try {
//     const notification = await User.findOneAndUpdate(
//       { email: req.user.email },
//       {
//         $pull: {
//           notifications: { notif: n._id },
//         },
//       }
//     ).exec();
//     res.json({ ok: true });
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.searchMatches = async (req, res) => {
//   console.log('searchMatches controller response => ', req.body);
//   const search = req.query.search
//     ? {
//         $or: [
//           { name: { $regex: req.query.search, $options: 'i' } },
//           { username: { $regex: req.query.search, $options: 'i' } },
//           { email: { $regex: req.query.search, $options: 'i' } },
//         ],
//       }
//     : {};
//   console.log(search);

//   const matches = await User.find(search).find({
//     _id: { $ne: req.body.user._id },
//   });
//   res.send(matches);
// };
