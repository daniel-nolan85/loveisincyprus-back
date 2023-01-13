const nodemailer = require('nodemailer');
const User = require('../models/user');
const Post = require('../models/post');
const Product = require('../models/product');
const Cart = require('../models/cart');
const Coupon = require('../models/coupon');
const Order = require('../models/order');
const Event = require('../models/event');
const Chat = require('../models/chat');
const Message = require('../models/message');
const UserSearch = require('../models/userSearch');
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
    host: 'mail.loveisincyprus.com',
    port: 465,
    auth: {
      user: 'loveisi3',
      pass: '4DaNLoV7!',
    },
    secure: true,
  });

  let mailOptions = {
    from: 'customercare@loveisincyprus.com',
    to: 'customercare@loveisincyprus.com',
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

  transporter.close();

  // let transporter = nodemailer.createTransport({
  //   service: 'gmail',
  //   port: 465,
  //   auth: {
  //     user: 'loveisincyprus@gmail.com',
  //     pass: 'revamp22',
  //   },
  //   secure: true,
  // });

  // let mailOptions = {
  //   from: email,
  //   to: 'loveisincyprus@gmail.com',
  //   subject: subject,
  //   html: `
  //     <h3>Information</h3>
  //     <ul>
  //     <li>Name: ${name}</li>
  //     <li>Email: ${email}</li>
  //     </ul>

  //     <h3>Message</h3>
  //     <p>${message}</p>
  //     `,
  // };

  // transporter.sendMail(mailOptions, (err, response) => {
  //   if (err) {
  //     res.send(err);
  //   } else {
  //     res.send('Success');
  //   }
  // });
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
  const user = await User.findOne({ mobile: req.user.phone_number }).exec();
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
  const user = await User.findOne({ mobile: req.user.phone_number }).exec();
  let cart = await Cart.findOne({ orderedBy: user._id })
    .populate('products.product')
    .exec();

  const { products, cartTotal, totalAfterDiscount } = cart;
  res.json({ products, cartTotal, totalAfterDiscount });
};

exports.emptyCart = async (req, res) => {
  const user = await User.findOne({ mobile: req.user.phone_number }).exec();
  const cart = await Cart.findOneAndRemove({ orderedBy: user._id }).exec();
  res.json(cart);
};

exports.saveAddress = async (req, res) => {
  console.log('saveAddress controller response => ', req.body);
  const userAddress = await User.findOneAndUpdate(
    { mobile: req.user.phone_number },
    { $addToSet: { address: req.body.address } }
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
  const user = await User.findOne({ mobile: req.user.phone_number }).exec();
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
  res.json({ validCoupon, totalAfterDiscount });
};

exports.createOrder = async (req, res) => {
  console.log('createOrder controller response => ', req.body);
  const paymentIntent = req.body.cardinityResponse;
  const { deliverTo, deliveryAddress, discount, deliveryFee } = req.body;
  const user = await User.findOne({ mobile: req.user.phone_number })
    .select('_id email')
    .exec();
  let { products } = await Cart.findOne({ orderedBy: user._id })
    .populate('products.product', 'title')
    .exec();
  let newOrder = await new Order({
    products,
    paymentIntent,
    orderedBy: user._id,
    deliverTo,
    deliveryAddress,
    discount,
    deliveryFee,
  })
    .populate('products.product', 'title')
    .save();

  console.log('products => ', products);
  console.log('user => ', user);

  const listItems = products.map((p) => {
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
      pass: '4DaNLoV7!',
    },
    secure: true,
  });

  let mailOptions = {
    from: 'customercare@loveisincyprus.com',
    to: user.email,
    subject: 'Order confirmation from Love is in Cyprus',
    // html: `<h1>Order confirmation</h1>`,
    html: `
      <h3 style="margin-bottom: 5px;">Thanks for your recent order</h3>
      <p style="margin-bottom: 5px;">Order ID: <span style="font-weight: bold">${
        newOrder._id
      }</span></p>
      <p style="margin-bottom: 5px;">Your payment has been successfully authorised and we will soon dispatch the following items:</p>
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
              newOrder.discount
                ? '€' + newOrder.discount.toFixed(2)
                : 'No coupon applied'
            }
      </p>
      <p style="margin-bottom: 5px;">${
        newOrder.deliveryFee &&
        'Delivery fee: €' + newOrder.deliveryFee.toFixed(2)
      }</p>
      <h3 style="margin-bottom: 5px;">${
        'Total: €' + newOrder.paymentIntent.amount
      }</h3>

      <p style="font-size: 18px; margin-bottom: 5px;">The status of your order is currently <span style="font-weight: bold;">${
        newOrder.orderStatus
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
  res.json(newOrder);
};

exports.orders = async (req, res) => {
  const user = await User.findOne({ mobile: req.user.phone_number }).exec();
  const userOrders = await Order.find({ orderedBy: user._id })
    .sort('-createdAt')
    .populate('products.product')
    .exec();
  res.json(userOrders);
};

exports.addToWishlist = async (req, res) => {
  const { productId } = req.body;
  const user = await User.findOneAndUpdate(
    { mobile: req.user.phone_number },
    { $addToSet: { wishlist: productId } }
  ).exec();
  res.json({ ok: true });
};

exports.wishlist = async (req, res) => {
  const list = await User.findOne({ mobile: req.user.phone_number })
    .select('wishlist')
    .populate('wishlist')
    .exec();
  res.json(list);
};

exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  const user = await User.findOneAndUpdate(
    { mobile: req.user.phone_number },
    { $pull: { wishlist: productId } }
  ).exec();
  res.json({ ok: true });
};

exports.getUserPointsTotal = async (req, res) => {
  const numberToAdd = await User.findOne({
    mobile: req.user.phone_number,
  }).select('pointsGained');
  const numberToRemove = await User.findOne({
    mobile: req.user.phone_number,
  }).select('pointsLost');
  const numberSpent = await User.findOne({
    mobile: req.user.phone_number,
  }).select('pointsSpent');
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
    }, 0) -
    numberSpent.pointsSpent.reduce((accumulator, object) => {
      return accumulator + object.amount;
    }, 0);
  // console.log('getUserPoints controller response => ', numberToAdd);
  // console.log('getUserPoints controller response => ', numberToRemove);
  // console.log('getUserPoints controller response => ', total);
  res.json(total);
};

exports.addPoints = async (req, res) => {
  console.log('addPoints controller response => ', req.body);
  // console.log('addPoints controller response => ', req.user);
  try {
    const { number, reason, otherUser } = req.body;
    const recentLogIn = await User.find({
      $and: [
        {
          mobile: req.user.phone_number,
          'pointsGained.reason': 'login',
          'pointsGained.awarded': {
            $gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      ],
    });
    if (reason === 'login' && recentLogIn.length > 0) {
      res.json({ ok: true });
      return;
    }

    if (reason === 'new visitor') {
      const awardOtherUserPoints = await User.findOneAndUpdate(
        { mobile: otherUser.mobile },
        {
          $push: { pointsGained: { amount: number, reason } },
        },
        { new: true }
      )
        .select('_id')
        .exec();
      res.json(awardOtherUserPoints);
      return;
    }

    if (reason === 'verified') {
      const newlyVerified = await User.findByIdAndUpdate(
        { _id: otherUser._id },
        {
          $push: { pointsGained: { amount: number, reason } },
        },
        { new: true }
      )
        .select('_id')
        .exec();
      res.json(newlyVerified);
      return;
    }

    const awardPoints = await User.findOneAndUpdate(
      { mobile: req.user.phone_number },
      {
        $push: { pointsGained: { amount: number, reason } },
      },
      { new: true }
    )
      .select('_id')
      .exec();
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
      { mobile: req.user.phone_number },
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

exports.spentPoints = async (req, res) => {
  console.log('spentPoints controller response => ', req.body);
  const { number, reason, _id, couponName } = req.body;
  var expired = new Date();
  expired.setDate(expired.getDate() + 3);

  if (reason === 'featured') {
    const addToFeatured = await User.findByIdAndUpdate(
      { _id },
      {
        $push: { pointsSpent: { amount: number, reason } },
        featuredMember: true,
      },
      { new: true }
    ).exec();
    res.json(addToFeatured);
  }

  if (reason === 'events') {
    const addToEvents = await User.findByIdAndUpdate(
      { _id },
      {
        $push: { pointsSpent: { amount: number, reason } },
        eventsEligible: true,
      },
      { new: true }
    ).exec();
    res.json(addToEvents);
  }

  if (reason === 'five') {
    const fivePercent = await User.findByIdAndUpdate(
      { _id },
      {
        $push: { pointsSpent: { amount: number, reason } },
      },
      { new: true }
    ).exec();

    const content = `Thanks for purchasing a 5% coupon. Your coupon name is ${couponName}. Please keep this name safe and use it during online checkout before ${expired}.`;
    const createCoupon = await new Coupon({
      name: couponName,
      expiry: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      discount: 5,
    }).save();

    const sender = await User.findOne({ _id: '621f58d359389f13dcc05a71' });
    const chat = await Chat.findOne({
      users: { $size: 2, $all: [sender._id, _id] },
    });
    var newMessage = {
      sender,
      content,
      chat,
    };

    try {
      var message = await Message.create(newMessage);
      message = await message.populate(
        'sender',
        'name username email profileImage'
      );
      message = await message.populate('chat');
      message = await User.populate(message, {
        path: 'chat.users',
        select: 'name username email profileImage',
      });
      const sendNotif = await User.findByIdAndUpdate(
        _id,
        { $push: { messages: { sender: sender._id } } },
        { new: true }
      );

      await Chat.findByIdAndUpdate(chat._id, {
        latestMessage: message,
      });
      res.json(message);
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }
  }

  if (reason === 'ten') {
    const tenPercent = await User.findByIdAndUpdate(
      { _id },
      {
        $push: { pointsSpent: { amount: number, reason } },
      },
      { new: true }
    ).exec();

    const content = `Thanks for purchasing a 10% coupon. Your coupon name is ${couponName}. Please keep this name safe and use it during online checkout before ${expired}.`;
    const createCoupon = await new Coupon({
      name: couponName,
      expiry: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      discount: 10,
    }).save();

    const sender = await User.findOne({ _id: '621f58d359389f13dcc05a71' });
    const chat = await Chat.findOne({
      users: { $size: 2, $all: [sender._id, _id] },
    });
    var newMessage = {
      sender,
      content,
      chat,
    };

    try {
      var message = await Message.create(newMessage);
      message = await message.populate(
        'sender',
        'name username email profileImage'
      );
      message = await message.populate('chat');
      message = await User.populate(message, {
        path: 'chat.users',
        select: 'name username email profileImage',
      });
      const sendNotif = await User.findByIdAndUpdate(
        _id,
        { $push: { messages: { sender: sender._id } } },
        { new: true }
      );

      await Chat.findByIdAndUpdate(chat._id, {
        latestMessage: message,
      });
      res.json(message);
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }
  }
};

exports.getUserPointsGainedData = async (req, res) => {
  const data = await User.findOne({ mobile: req.user.phone_number })
    .select('pointsGained')
    .populate('pointsGained')
    .exec();
  // console.log('getUserPointsData total controller response => ', data);
  res.json(data);
};

exports.getUserPointsLostData = async (req, res) => {
  const data = await User.findOne({ mobile: req.user.phone_number })
    .select('pointsLost')
    .populate('pointsLost')
    .exec();
  // console.log('getUserPointsData total controller response => ', data);
  res.json(data);
};

exports.getUserPointsSpentData = async (req, res) => {
  const data = await User.findOne({ mobile: req.user.phone_number })
    .select('pointsSpent')
    .populate('pointsSpent')
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
      .populate('likes', '_id name email profileImage username')
      .populate('comments.postedBy', '_id name email profileImage username');

    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.markNotifAsRead = async (req, res) => {
  // console.log('markNotifAsRead controller response => ', req.body);
  const notif = await User.findOneAndUpdate(
    { mobile: req.user.phone_number, 'notifications._id': req.body.n._id },
    { $set: { 'notifications.$.new': 'false' } }
  );
  res.json({ ok: true });
};

exports.acceptInvite = async (req, res) => {
  console.log('acceptInvite controller response => ', req.body);
  try {
    const existingInvite = await User.findOne({
      _id: req.body.user._id,
      'events._id': req.body.post.notif._id,
    });
    if (!existingInvite) {
      const user = await User.findOneAndUpdate(
        { mobile: req.user.phone_number },
        {
          $addToSet: { events: req.body.post.notif },
        }
      );
    }
    const event = await Event.findOneAndUpdate(
      {
        _id: req.body.post.notif._id,
      },
      {
        $pull: { maybe: req.body.user._id, declined: req.body.user._id },
        $addToSet: { accepted: req.body.user._id },
      }
    ).populate('accepted', '_id name email profileImage username');
    const smallUser = await User.findById({ _id: req.body.user._id }).select(
      '_id name email username profileImage'
    );
    const notification = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'notifications._id': req.body.post._id,
      },
      {
        $pull: {
          'notifications.$.notif.maybe': { mobile: req.user.phone_number },
          'notifications.$.notif.declined': { mobile: req.user.phone_number },
        },
        $addToSet: { 'notifications.$.notif.accepted': smallUser },
      }
    );
    const isGoing = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'events._id': req.body.post.notif._id,
      },
      { $set: { 'events.$.going': 'yes' } }
    );
    res.json(isGoing);
  } catch (err) {
    console.log(err);
  }
};

exports.maybe = async (req, res) => {
  console.log('maybe controller response => ', req.body);
  try {
    const existingInvite = await User.findOne({
      _id: req.body.user._id,
      'events._id': req.body.post.notif._id,
    });
    if (!existingInvite) {
      const user = await User.findOneAndUpdate(
        { mobile: req.user.phone_number },
        {
          $addToSet: { events: req.body.post.notif },
        }
      );
    }
    const event = await Event.findOneAndUpdate(
      {
        _id: req.body.post.notif._id,
      },
      {
        $pull: { accepted: req.body.user._id, declined: req.body.user._id },
        $addToSet: { maybe: req.body.user._id },
      }
    ).populate('maybe', '_id name email profileImage username');
    const smallUser = await User.findById({ _id: req.body.user._id }).select(
      '_id name email username profileImage'
    );
    const notification = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'notifications._id': req.body.post._id,
      },
      {
        $pull: {
          'notifications.$.notif.accepted': { mobile: req.user.phone_number },
          'notifications.$.notif.declined': { mobile: req.user.phone_number },
        },
        $addToSet: { 'notifications.$.notif.maybe': smallUser },
      }
    );
    const isGoing = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'events._id': req.body.post.notif._id,
      },
      { $set: { 'events.$.going': 'maybe' } }
    );
    res.json(isGoing);
  } catch (err) {
    console.log(err);
  }
};

exports.declineInvite = async (req, res) => {
  console.log('declineInvite controller response => ', req.body);
  try {
    const existingInvite = await User.findOne({
      _id: req.body.user._id,
      'events._id': req.body.post.notif._id,
    });
    if (!existingInvite) {
      const user = await User.findOneAndUpdate(
        { mobile: req.user.phone_number },
        {
          $addToSet: { events: req.body.post.notif },
        }
      );
    }
    const event = await Event.findOneAndUpdate(
      {
        _id: req.body.post.notif._id,
      },
      {
        $pull: { accepted: req.body.user._id, maybe: req.body.user._id },
        $addToSet: { declined: req.body.user._id },
      }
    ).populate('declined', '_id name email profileImage username');
    const smallUser = await User.findById({ _id: req.body.user._id }).select(
      '_id name email username profileImage'
    );
    const notification = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'notifications._id': req.body.post._id,
      },
      {
        $pull: {
          'notifications.$.notif.accepted': { mobile: req.user.phone_number },
          'notifications.$.notif.maybe': { mobile: req.user.phone_number },
        },
        $addToSet: { 'notifications.$.notif.declined': smallUser },
      }
    );
    const isGoing = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'events._id': req.body.post.notif._id,
      },
      { $set: { 'events.$.going': 'no' } }
    );
    res.json(isGoing);
  } catch (err) {
    console.log(err);
  }
};

// exports.deleteNotification = async (req, res) => {
//   const n = req.body.n.notif;
//   console.log('deleteNotification controller response => ', n);
//   try {
//     const notification = await User.findOneAndUpdate(
//       { mobile: req.user.phone_number },
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

exports.listAll = async (req, res) => {
  const users = await User.find({})
    .limit(parseInt(req.params.count))
    .select('_id name email username profileImage about')
    .exec();
  res.json(users);
};

exports.searchFilters = async (req, res) => {
  const { query } = req.body;
  const searchedUsers = [];

  if (query) {
    const users = await User.find({ $text: { $search: query } })
      .select('_id name email username profileImage about eventsEligible optIn')
      .exec();
    res.json(users);
  } else {
    Promise.all(
      req.body.map(async (q) => {
        if (q.type && q.type == 'radio') {
          var radioQuery = {};
          radioQuery[q.field] = q.lookUp;
          const users = await User.find(radioQuery).select(
            '_id name email username profileImage about eventsEligible optIn'
          );
          searchedUsers.push(users);
        }
        if (q.range) {
          var rangeQuery = {};
          rangeQuery[q.field] = { $gte: q.range[0], $lte: q.range[1] };
          const users = await User.find(rangeQuery).select(
            '_id name email username profileImage about eventsEligible optIn'
          );
          searchedUsers.push(users);
        }
        if (q.key) {
          var dropdownQuery = {};
          dropdownQuery[q.field] = q.key;
          const users = await User.find(dropdownQuery).select(
            '_id name email username profileImage about eventsEligible optIn'
          );
          searchedUsers.push(users);
        }
        if (q.type && q.type == 'number') {
          var numberQuery = {};
          numberQuery[q.field] = q.entry;
          const users = await User.find(numberQuery).select(
            '_id name email username profileImage about eventsEligible optIn'
          );
          searchedUsers.push(users);
        }
        if (q.type && q.type == 'string') {
          var stringQuery = {};
          stringQuery[q.field] = { $regex: q.entry };
          const users = await User.find(stringQuery).select(
            '_id name email username profileImage about eventsEligible optIn'
          );
          searchedUsers.push(users);
        }
        if (q.type && q.type == 'array') {
          var arrayQuery = {};
          arrayQuery[q.field] = { $all: q.entry };
          const users = await User.find(arrayQuery).select(
            '_id name email username profileImage about eventsEligible optIn'
          );
          searchedUsers.push(users);
        }
      })
    ).then(() => {
      const str = (o) =>
        JSON.stringify(
          Object.keys(o)
            .sort()
            .map((key) => [key, o[key]])
        );
      const mapify = (arr) => new Map(arr.map((o) => [str(o), o]));

      const intersection = (searchedUsers) =>
        !searchedUsers.length
          ? []
          : [
              ...searchedUsers
                .slice(1)
                .reduce(
                  (map, arr) => mapify(arr.filter((o) => map.get(str(o)))),
                  mapify(searchedUsers[0])
                )
                .values(),
            ];

      const filteredUsers = intersection(searchedUsers);
      res.json(filteredUsers);
    });
  }
};

exports.saveSearch = async (req, res) => {
  console.log('saveSearch controller response => ', req.body);
  const { searchName, unique } = req.body;

  try {
    if (!searchName || !unique) {
      res.json({
        error: 'Name and fields required',
      });
    } else {
      const search = new UserSearch({ name: searchName, params: unique });
      search.save();
      res.json(search);
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};

exports.analyseUsers = async (req, res) => {
  console.log('analyseUsers controller response => ', req.body);
  const { u, user } = req.body;
  console.log('u.genderWanted => ', u.genderWanted);
  console.log('user.gender => ', user.gender);

  let compatibility = {
    points: 0,
  };

  // if (u.genderWanted == user.gender) compatibility = compatibility + 5;
  if (u.genderWanted && user.gender && u.genderWanted == user.gender) {
    compatibility.genderTheyWant = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.gender && user.genderWanted && u.gender == user.genderWanted) {
    compatibility.genderYouWant = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.location && user.location && u.location == user.location) {
    compatibility.location = true;
    compatibility.points = compatibility.points + 5;
  }
  if (
    u.location &&
    user.location &&
    u.location != user.location &&
    u.relocate == 'abroad'
  ) {
    compatibility.theyWillRelocate = true;
    compatibility.points = compatibility.points + 5;
  }
  if (
    u.location &&
    user.location &&
    u.location != user.location &&
    u.relocate == 'country'
  ) {
    compatibility.theyWillRelocate = true;
    compatibility.points = compatibility.points + 5;
  }
  if (
    u.location &&
    user.location &&
    u.location != user.location &&
    user.relocate == 'abroad'
  ) {
    compatibility.youWillRelocate = true;
    compatibility.points = compatibility.points + 5;
  }
  if (
    u.location &&
    user.location &&
    u.location != user.location &&
    user.relocate == 'country'
  ) {
    compatibility.youWillRelocate = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.relWanted && user.relWanted && u.relWanted == user.relWanted) {
    compatibility.relWanted = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.language && user.language && u.language == user.language) {
    compatibility.language = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.drinks && user.drinks && u.drinks == user.drinks) {
    compatibility.drinks = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.smokes && user.smokes && u.smokes == user.smokes) {
    compatibility.smokes = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.education && user.education && u.education == user.education) {
    compatibility.education = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.occupation && user.occupation && u.occupation == user.occupation) {
    compatibility.occupation = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.politics && user.politics && u.politics == user.politics) {
    compatibility.politics = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.religion && user.religion && u.religion == user.religion) {
    compatibility.religion = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.foods && user.foods && u.foods == user.foods) {
    compatibility.foods = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.livesWith && user.livesWith && u.livesWith == user.livesWith) {
    compatibility.livesWith = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.roleInLife && user.roleInLife && u.roleInLife == user.roleInLife) {
    compatibility.roleInLife = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.managesEdu && user.managesEdu && u.managesEdu == user.managesEdu) {
    compatibility.managesEdu = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.relocate && user.relocate && u.relocate == user.relocate) {
    compatibility.relocate = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.sexLikes && user.sexLikes && u.sexLikes == user.sexLikes) {
    compatibility.sexLikes = true;
    compatibility.points = compatibility.points + 5;
  }
  if (
    u.sexFrequency &&
    user.sexFrequency &&
    u.sexFrequency == user.sexFrequency
  ) {
    compatibility.sexFrequency = true;
    compatibility.points = compatibility.points + 5;
  }
  if (u.loves && user.loves) {
    let commonLoves = u.loves.filter((x) => user.loves.includes(x));
    compatibility.loves = commonLoves;
    compatibility.points = compatibility.points + commonLoves.length * 5;
  }
  if (u.hates && user.hates) {
    let commonHates = u.hates.filter((x) => user.hates.includes(x));
    compatibility.hates = commonHates;
    compatibility.points = compatibility.points + commonHates.length * 5;
  }
  if (u.pets && user.pets) {
    let commonPets = u.pets.filter((x) => user.pets.includes(x));
    compatibility.pets = commonPets;
    compatibility.points = compatibility.points + commonPets.length * 5;
  }
  if (u.interests && user.interests) {
    let commonInterests = u.interests.filter((x) => user.interests.includes(x));
    compatibility.interests = commonInterests;
    compatibility.points = compatibility.points + commonInterests.length * 5;
  }
  if (u.music && user.music) {
    let commonMusic = u.music.filter((x) => user.music.includes(x));
    compatibility.music = commonMusic;
    compatibility.points = compatibility.points + commonMusic.length * 5;
  }
  if (u.books && user.books) {
    let commonBooks = u.books.filter((x) => user.books.includes(x));
    compatibility.books = commonBooks;
    compatibility.points = compatibility.points + commonBooks.length * 5;
  }
  if (u.films && user.films) {
    let commonFilms = u.films.filter((x) => user.films.includes(x));
    compatibility.films = commonFilms;
    compatibility.points = compatibility.points + commonFilms.length * 5;
  }
  if (u.sports && user.sports) {
    let commonSports = u.sports.filter((x) => user.sports.includes(x));
    compatibility.sports = commonSports;
    compatibility.points = compatibility.points + commonSports.length * 5;
  }
  if (u.hobbies && user.hobbies) {
    let commonHobbies = u.hobbies.filter((x) => user.hobbies.includes(x));
    compatibility.hobbies = commonHobbies;
    compatibility.points = compatibility.points + commonHobbies.length * 5;
  }
  if (u.traits && user.traits) {
    let commonTraits = u.traits.filter((x) => user.traits.includes(x));
    compatibility.traits = commonTraits;
    compatibility.points = compatibility.points + commonTraits.length * 5;
  }
  if (u.treatSelf && user.treatSelf) {
    let commonTreatSelf = u.treatSelf.filter((x) => user.treatSelf.includes(x));
    compatibility.treatSelf = commonTreatSelf;
    compatibility.points = compatibility.points + commonTreatSelf.length * 5;
  }

  const range = (min, max) =>
    [...Array(max - min + 1).keys()].map((i) => i + min);

  if (u.age && user.ageOfPartner && user.ageOfPartner !== 'Over 80') {
    const start = parseInt(user.ageOfPartner.split('-')[0]);
    const end = parseInt(user.ageOfPartner.split('-')[1]);
    let ageYouWant = range(start, end);
    if (ageYouWant.includes(u.age)) {
      compatibility.ageYouWant = true;
      compatibility.points = compatibility.points + 5;
    }
  }

  if (
    u.age &&
    user.ageOfPartner &&
    user.ageOfPartner === 'Over 80' &&
    u.age > 79
  ) {
    compatibility.ageYouWant = true;
    compatibility.points = compatibility.points + 5;
  }

  if (user.age && u.ageOfPartner && u.ageOfPartner !== 'Over 80') {
    console.log('age');
    const start = parseInt(u.ageOfPartner.split('-')[0]);
    const end = parseInt(u.ageOfPartner.split('-')[1]);
    let ageTheyWant = range(start, end);
    console.log(user.age);
    console.log(ageTheyWant);
    if (ageTheyWant.includes(u.age)) {
      compatibility.ageTheyWant = true;
      compatibility.points = compatibility.points + 5;
    }
  }

  if (
    user.age &&
    u.ageOfPartner &&
    u.ageOfPartner === 'Over 80' &&
    user.age > 79
  ) {
    compatibility.ageTheyWant = true;
    compatibility.points = compatibility.points + 5;
  }

  console.log('compatibility => ', compatibility);

  res.json(compatibility);
};

exports.progressCompletion = async (req, res) => {
  console.log('progressCompletion => ', req.body);
  const { user } = req.body;
  let completion = {
    percentage: 0,
  };

  if (Object.keys(user).includes('coverImage')) {
    completion.percentage = completion.percentage + 3;
  } else {
    completion.coverImage = true;
  }
  if (Object.keys(user).includes('profileImage')) {
    completion.percentage = completion.percentage + 3;
  } else {
    completion.profileImage = true;
  }
  if (Object.keys(user).includes('name')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.name = true;
  }
  if (Object.keys(user).includes('gender')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.gender = true;
  }
  if (Object.keys(user).includes('about')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.about = true;
  }
  if (Object.keys(user).includes('birthday')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.birthday = true;
  }
  if (Object.keys(user).includes('location')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.location = true;
  }
  if (Object.keys(user).includes('genderWanted')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.genderWanted = true;
  }
  if (Object.keys(user).includes('relWanted')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.relWanted = true;
  }
  if (Object.keys(user).includes('language')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.language = true;
  }
  if (Object.keys(user).includes('maritalStatus')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.maritalStatus = true;
  }
  if (Object.keys(user).includes('numOfChildren')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.numOfChildren = true;
  }
  if (Object.keys(user).includes('drinks')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.drinks = true;
  }
  if (Object.keys(user).includes('smokes')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.smokes = true;
  }
  if (Object.keys(user).includes('nationality')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.nationality = true;
  }
  if (Object.keys(user).includes('height')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.height = true;
  }
  if (Object.keys(user).includes('build')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.build = true;
  }
  if (Object.keys(user).includes('hairColor')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hairColor = true;
  }
  if (Object.keys(user).includes('hairStyle')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hairStyle = true;
  }
  if (Object.keys(user).includes('hairLength')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hairLength = true;
  }
  if (Object.keys(user).includes('eyeColor')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.eyeColor = true;
  }
  if (Object.keys(user).includes('ethnicity')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.ethnicity = true;
  }
  if (Object.keys(user).includes('feetType')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.feetType = true;
  }
  if (Object.keys(user).includes('education')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.education = true;
  }
  if (Object.keys(user).includes('occupation')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.occupation = true;
  }
  if (Object.keys(user).includes('politics')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.politics = true;
  }
  if (Object.keys(user).includes('religion')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.religion = true;
  }
  if (Object.keys(user).includes('foods')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.foods = true;
  }
  if (Object.keys(user).includes('livesWith')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.livesWith = true;
  }
  if (Object.keys(user).includes('roleInLife')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.roleInLife = true;
  }
  if (Object.keys(user).includes('managesEdu')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.managesEdu = true;
  }
  if (Object.keys(user).includes('marriage')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.marriage = true;
  }
  if (Object.keys(user).includes('income')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.income = true;
  }
  if (Object.keys(user).includes('ageOfPartner')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.ageOfPartner = true;
  }
  if (Object.keys(user).includes('changes')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.changes = true;
  }
  if (Object.keys(user).includes('relocate')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.relocate = true;
  }
  if (Object.keys(user).includes('sexLikes')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.sexLikes = true;
  }
  if (Object.keys(user).includes('sexFrequency')) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.sexFrequency = true;
  }
  if (user.loves.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.loves = true;
  }
  if (user.hates.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hates = true;
  }
  if (user.pets.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.pets = true;
  }
  if (user.interests.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.interests = true;
  }
  if (user.music.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.music = true;
  }
  if (user.books.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.books = true;
  }
  if (user.films.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.films = true;
  }
  if (user.sports.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.sports = true;
  }
  if (user.hobbies.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hobbies = true;
  }
  if (user.traits.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.traits = true;
  }
  if (user.treatSelf.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.treatSelf = true;
  }

  res.json(completion);

  if (completion.percentage == 100) {
    const complete = await User.findByIdAndUpdate(
      user._id,
      { profileComplete: true },
      { new: true }
    );
  }
};

exports.optInOrOut = async (req, res) => {
  console.log('optInOrOut controller response => ', req.body);
  if (req.body.user.optIn) {
    const optOut = await User.findByIdAndUpdate(
      req.body.user._id,
      { optIn: false },
      { new: true }
    ).select('optIn');
    res.json(optOut);
  } else {
    const optIn = await User.findByIdAndUpdate(
      req.body.user._id,
      { optIn: true },
      { new: true }
    ).select('optIn');
    res.json(optIn);
  }
};

exports.newMessageCount = async (req, res) => {
  console.log('newMessageCount controller response => ', req.body);
  const user = await User.findByIdAndUpdate(req.body._id, { new: true }).select(
    'messages'
  );
  res.json(user);
};

// exports.resetMessageCount = async (req, res) => {
//   const user = await User.findByIdAndUpdate(
//     req.body.user._id,
//     { $set: { messages: [] } },
//     { new: true }
//   );
//   res.json(user);
// };

exports.newNotificationCount = async (req, res) => {
  console.log('newNotificationCount controller response => ', req.body);
  const { user, notif, reason, otherUser } = req.body;

  if (reason === 'like') {
    const notify = await User.findByIdAndUpdate(user._id, { new: true }).select(
      'newNotifs'
    );
    res.json(notify);
  }
  if (reason === 'comment') {
    const notify = await User.findByIdAndUpdate(user._id, { new: true }).select(
      'newNotifs'
    );
    res.json(notify);
  }
  if (reason === 'follower') {
    const notify = await User.findByIdAndUpdate(user._id, { new: true }).select(
      'newNotifs'
    );
    res.json(notify);
  }
  if (reason === 'visitor') {
    const notify = await User.findByIdAndUpdate(user._id, { new: true }).select(
      'newNotifs'
    );
    res.json(notify);
  }
  if (reason === 'event') {
    const notify = await User.findByIdAndUpdate(user._id, { new: true }).select(
      'newNotifs'
    );
    res.json(notify);
  }
};

exports.resetNotificationCount = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.body.user._id,
    { $set: { newNotifs: [] } },
    { new: true }
  );
  res.json(user);
};

exports.fetchUserSearches = async (req, res) => {
  const search = await UserSearch.find();

  res.json(search);
};

exports.expiredMembership = async (req, res) => {
  const user = await User.findById({ _id: req.body.user._id });
  if (user.membership.paid && user.membership.expiry.getTime() < Date.now()) {
    const expiredUser = await User.findByIdAndUpdate(
      { _id: user._id },
      {
        'membership.paid': false,
      },
      { new: true }
    ).exec();
    res.json(expiredUser);
    return;
  }
  if (
    user.membership.paid &&
    user.membership.expiry.getTime() < Date.now() + 7 * 24 * 3600 * 1000
  ) {
    res.json({ soon: true });
    return;
  }
};

exports.clearProfileImage = async (req, res) => {
  console.log('clearProfileImage controller response => ', req.body);
  const { faces, user } = req.body;
  if (faces.length > 0) {
    const clearImage = await User.findByIdAndUpdate(
      { _id: user._id },
      {
        clearPhoto: true,
      },
      { new: true }
    ).exec();
    res.json(clearImage);
  } else {
    const clearImage = await User.findByIdAndUpdate(
      { _id: user._id },
      {
        clearPhoto: false,
      },
      { new: true }
    ).exec();
    res.json(clearImage);
  }
};

exports.totalUsers = async (req, res) => {
  try {
    const total = await User.find().estimatedDocumentCount();
    res.json(total);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchProducts = async (req, res) => {
  console.log('fetchProducts controller response => ', req.body);
  const products = await Order.findById({ _id: req.body._id })
    .populate('products.product')
    .exec();
  res.json(products);
};

exports.expiredSuspension = async (req, res) => {
  const users = await User.updateMany(
    {
      'userStatus.until': { $lte: new Date(Date.now()) },
    },
    {
      userStatus: { suspended: false, until: '', reason: '' },
    },
    { new: true }
  ).select('userStatus');
  res.json(users);
};

exports.highCompats = async (req, res) => {
  const { user } = req.body;
  const range = (min, max) =>
    [...Array(max - min + 1).keys()].map((i) => i + min);
  let compatibility = {
    points: 0,
  };
  let highCompats = [];
  let veryHighCompats = [];
  let superCompats = [];

  const users = await User.find();
  users.map((u) => {
    if (u.genderWanted && user.gender && u.genderWanted == user.gender) {
      compatibility.genderTheyWant = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.gender && user.genderWanted && u.gender == user.genderWanted) {
      compatibility.genderYouWant = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.location && user.location && u.location == user.location) {
      compatibility.location = true;
      compatibility.points = compatibility.points + 5;
    }
    if (
      u.location &&
      user.location &&
      u.location != user.location &&
      u.relocate == 'abroad'
    ) {
      compatibility.theyWillRelocate = true;
      compatibility.points = compatibility.points + 5;
    }
    if (
      u.location &&
      user.location &&
      u.location != user.location &&
      u.relocate == 'country'
    ) {
      compatibility.theyWillRelocate = true;
      compatibility.points = compatibility.points + 5;
    }
    if (
      u.location &&
      user.location &&
      u.location != user.location &&
      user.relocate == 'abroad'
    ) {
      compatibility.youWillRelocate = true;
      compatibility.points = compatibility.points + 5;
    }
    if (
      u.location &&
      user.location &&
      u.location != user.location &&
      user.relocate == 'country'
    ) {
      compatibility.youWillRelocate = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.relWanted && user.relWanted && u.relWanted == user.relWanted) {
      compatibility.relWanted = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.language && user.language && u.language == user.language) {
      compatibility.language = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.drinks && user.drinks && u.drinks == user.drinks) {
      compatibility.drinks = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.smokes && user.smokes && u.smokes == user.smokes) {
      compatibility.smokes = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.education && user.education && u.education == user.education) {
      compatibility.education = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.occupation && user.occupation && u.occupation == user.occupation) {
      compatibility.occupation = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.politics && user.politics && u.politics == user.politics) {
      compatibility.politics = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.religion && user.religion && u.religion == user.religion) {
      compatibility.religion = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.foods && user.foods && u.foods == user.foods) {
      compatibility.foods = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.livesWith && user.livesWith && u.livesWith == user.livesWith) {
      compatibility.livesWith = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.roleInLife && user.roleInLife && u.roleInLife == user.roleInLife) {
      compatibility.roleInLife = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.managesEdu && user.managesEdu && u.managesEdu == user.managesEdu) {
      compatibility.managesEdu = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.relocate && user.relocate && u.relocate == user.relocate) {
      compatibility.relocate = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.sexLikes && user.sexLikes && u.sexLikes == user.sexLikes) {
      compatibility.sexLikes = true;
      compatibility.points = compatibility.points + 5;
    }
    if (
      u.sexFrequency &&
      user.sexFrequency &&
      u.sexFrequency == user.sexFrequency
    ) {
      compatibility.sexFrequency = true;
      compatibility.points = compatibility.points + 5;
    }
    if (u.loves && user.loves) {
      let commonLoves = u.loves.filter((x) => user.loves.includes(x));
      compatibility.loves = commonLoves;
      compatibility.points = compatibility.points + commonLoves.length * 5;
    }
    if (u.hates && user.hates) {
      let commonHates = u.hates.filter((x) => user.hates.includes(x));
      compatibility.hates = commonHates;
      compatibility.points = compatibility.points + commonHates.length * 5;
    }
    if (u.pets && user.pets) {
      let commonPets = u.pets.filter((x) => user.pets.includes(x));
      compatibility.pets = commonPets;
      compatibility.points = compatibility.points + commonPets.length * 5;
    }
    if (u.interests && user.interests) {
      let commonInterests = u.interests.filter((x) =>
        user.interests.includes(x)
      );
      compatibility.interests = commonInterests;
      compatibility.points = compatibility.points + commonInterests.length * 5;
    }
    if (u.music && user.music) {
      let commonMusic = u.music.filter((x) => user.music.includes(x));
      compatibility.music = commonMusic;
      compatibility.points = compatibility.points + commonMusic.length * 5;
    }
    if (u.books && user.books) {
      let commonBooks = u.books.filter((x) => user.books.includes(x));
      compatibility.books = commonBooks;
      compatibility.points = compatibility.points + commonBooks.length * 5;
    }
    if (u.films && user.films) {
      let commonFilms = u.films.filter((x) => user.films.includes(x));
      compatibility.films = commonFilms;
      compatibility.points = compatibility.points + commonFilms.length * 5;
    }
    if (u.sports && user.sports) {
      let commonSports = u.sports.filter((x) => user.sports.includes(x));
      compatibility.sports = commonSports;
      compatibility.points = compatibility.points + commonSports.length * 5;
    }
    if (u.hobbies && user.hobbies) {
      let commonHobbies = u.hobbies.filter((x) => user.hobbies.includes(x));
      compatibility.hobbies = commonHobbies;
      compatibility.points = compatibility.points + commonHobbies.length * 5;
    }
    if (u.traits && user.traits) {
      let commonTraits = u.traits.filter((x) => user.traits.includes(x));
      compatibility.traits = commonTraits;
      compatibility.points = compatibility.points + commonTraits.length * 5;
    }
    if (u.treatSelf && user.treatSelf) {
      let commonTreatSelf = u.treatSelf.filter((x) =>
        user.treatSelf.includes(x)
      );
      compatibility.treatSelf = commonTreatSelf;
      compatibility.points = compatibility.points + commonTreatSelf.length * 5;
    }
    if (u.age && user.ageOfPartner && user.ageOfPartner !== 'Over 80') {
      const start = parseInt(user.ageOfPartner.split('-')[0]);
      const end = parseInt(user.ageOfPartner.split('-')[1]);
      let ageYouWant = range(start, end);
      if (ageYouWant.includes(u.age)) {
        compatibility.ageYouWant = true;
        compatibility.points = compatibility.points + 5;
      }
    }
    if (
      u.age &&
      user.ageOfPartner &&
      user.ageOfPartner === 'Over 80' &&
      u.age > 79
    ) {
      compatibility.ageYouWant = true;
      compatibility.points = compatibility.points + 5;
    }
    if (user.age && u.ageOfPartner && u.ageOfPartner !== 'Over 80') {
      const start = parseInt(u.ageOfPartner.split('-')[0]);
      const end = parseInt(u.ageOfPartner.split('-')[1]);
      let ageTheyWant = range(start, end);
      if (ageTheyWant.includes(u.age)) {
        compatibility.ageTheyWant = true;
        compatibility.points = compatibility.points + 5;
      }
    }
    if (
      user.age &&
      u.ageOfPartner &&
      u.ageOfPartner === 'Over 80' &&
      user.age > 79
    ) {
      compatibility.ageTheyWant = true;
      compatibility.points = compatibility.points + 5;
    }
    if (compatibility.points > 60 && compatibility.points <= 75) {
      const user = {
        username: u.username,
        name: u.name,
        _id: u._id,
        profileImage: u.profileImage,
        email: u.email,
      };
      highCompats.push(user);
    }
    if (compatibility.points > 75 && compatibility.points <= 100) {
      const user = {
        username: u.username,
        name: u.name,
        _id: u._id,
        profileImage: u.profileImage,
        email: u.email,
      };
      veryHighCompats.push(user);
    }
    if (compatibility.points > 100) {
      const user = {
        username: u.username,
        name: u.name,
        _id: u._id,
        profileImage: u.profileImage,
        email: u.email,
      };
      superCompats.push(user);
    }
  });
  res.json({ highCompats, veryHighCompats, superCompats });
  // console.log('highCompats => ', highCompats);
  // console.log('veryHighCompats => ', veryHighCompats);
  // console.log('superCompats => ', superCompats);
};

exports.updateAge = async (req, res) => {
  if (req.body.user.birthday) {
    function calculate_age(dob) {
      var diff_ms = Date.now() - dob.getTime();
      var age_dt = new Date(diff_ms);
      return Math.abs(age_dt.getUTCFullYear() - 1970);
    }
    age = calculate_age(new Date(req.body.user.birthday));
    const updateAge = await User.findOneAndUpdate(
      { _id: req.body.user._id },
      { age }
    );
    res.json(updateAge);
  }
  console.log(req.body.user.age);
};
