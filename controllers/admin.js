const Order = require('../models/order');
const User = require('../models/user');
const Message = require('../models/message');
const Ad = require('../models/ad');
const Post = require('../models/post');
const Product = require('../models/product');
const Refund = require('../models/refund');
const GiftCard = require('../models/giftCard');
const nodemailer = require('nodemailer');
const Cardinity = require('cardinity-nodejs');

const Client = Cardinity.client();
const RefundMember = Cardinity.refund();

const client = new Client(
  process.env.CARDINITY_KEY,
  process.env.CARDINITY_SECRET
);

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
    return `<tr>
        <td>${p.product.title}</td>
        <td>€${p.price}</td>
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
        updated.paymentIntent.id
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
      }</span>. 
      ${
        updated.orderStatus === 'cancelled'
          ? 'You have been fully refunded for this transaction'
          : "We'll continue to notify you as this updates"
      } .</p>
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

  if (updated.orderStatus === 'Cancelled') {
    const refundMember = new RefundMember({
      amount: updated.paymentIntent.amount,
      description: 'Admin has cancelled this transaction',
      id: updated.paymentIntent.id,
    });

    client
      .call(refundMember)
      .then(async (response) => {
        console.log('response => ', response);
      })
      .catch((err) => {
        console.log(err);
      });
  }
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

  const ads = await Ad.find({
    status: 'paid',
  });

  let sumOfAds = 0;
  ads.map((ad) => {
    if (ad.duration === 'one day') {
      sumOfAds += 5;
    } else if (ad.duration === 'one week') {
      sumOfAds += 20;
    } else if (ad.duration === 'two weeks') {
      sumOfAds += 30;
    } else if (ad.duration === 'one month') {
      sumOfAds += 50;
    }
  });

  const giftCards = await GiftCard.find({});

  let sumOfGiftCards = 0;
  giftCards.map((gc) => {
    let amount = parseFloat(gc.amount);
    sumOfGiftCards += amount;
  });

  const income =
    parseFloat(sumOfOrders) +
    parseFloat(sumOfSubscriptions) +
    parseFloat(sumOfAds) +
    parseFloat(sumOfGiftCards);

  console.log('ads => ', ads);

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

exports.fetchNewRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({ refundStatus: 'requested' }).select(
      '_id'
    );
    res.json(refunds);
  } catch (err) {
    console.log(err);
  }
};

exports.usersData = async (req, res) => {
  const { byPage } = req.body;
  const users = await User.find({})
    .select(
      '_id username name email gender age createdAt lastLogin ipAddresses mobile membership verified profilePhotos profilePercentage pointsTotal featuredMember following followers visitors reports reported messagesSent messagesReceived itemsOrdered itemsOrderedValue giftCardsSent giftCardsSentValue giftCardsReceived giftCardsReceivedValue tShirts sprays droppers perfumes'
    )
    .populate('messagesSent.receiver', '_id name username email profileImage')
    .populate('messagesReceived.sender', '_id name username email profileImage')
    .exec();
  const removeAdmin = users.filter((u) => u._id != '63dc1d2a8eb01e4110743044');
  if (byPage !== 'all') {
    const filteredUsers = removeAdmin.slice(0, byPage);
    res.json(filteredUsers);
  } else {
    res.json(removeAdmin);
  }
};

exports.progressCompletionData = async (req, res) => {
  const user = await User.findById(req.body.id).select(
    'coverImage profileImage username name gender about birthday location genderWanted relWanted language maritalStatus numOfChildren drinks smokes nationality height build hairColor hairStyle hairLength eyeColor ethnicity feetType education occupation politics religion foods livesWith roleInLife managesEdu marriage income ageOfPartner changes relocate sexLikes sexFrequency loves hates pets interests music books films sports hobbies traits treatSelf'
  );
  let completion = {
    percentage: 0,
  };
  if (user.username !== null && user.username !== undefined) {
    completion.username = user.username;
  }
  if (user.coverImage !== null && user.coverImage !== undefined) {
    completion.percentage = completion.percentage + 3;
  } else {
    completion.coverImage = true;
  }
  if (user.profileImage !== null && user.profileImage !== undefined) {
    completion.percentage = completion.percentage + 3;
  } else {
    completion.profileImage = true;
  }
  if (user.name !== null && user.name !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.name = true;
  }
  if (user.gender !== null && user.gender !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.gender = true;
  }
  if (user.about !== null && user.about !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.about = true;
  }
  if (user.birthday !== null && user.birthday !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.birthday = true;
  }
  if (user.location !== null && user.location !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.location = true;
  }
  if (user.genderWanted !== null && user.genderWanted !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.genderWanted = true;
  }
  if (user.relWanted !== null && user.relWanted !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.relWanted = true;
  }
  if (user.language !== null && user.language !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.language = true;
  }
  if (user.maritalStatus !== null && user.maritalStatus !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.maritalStatus = true;
  }
  if (user.numOfChildren !== null && user.numOfChildren !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.numOfChildren = true;
  }
  if (user.drinks !== null && user.drinks !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.drinks = true;
  }
  if (user.smokes !== null && user.smokes !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.smokes = true;
  }
  if (user.nationality !== null && user.nationality !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.nationality = true;
  }
  if (user.height !== null && user.height !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.height = true;
  }
  if (user.build !== null && user.build !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.build = true;
  }
  if (user.hairColor !== null && user.hairColor !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hairColor = true;
  }
  if (user.hairStyle !== null && user.hairStyle !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hairStyle = true;
  }
  if (user.hairLength !== null && user.hairLength !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hairLength = true;
  }
  if (user.eyeColor !== null && user.eyeColor !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.eyeColor = true;
  }
  if (user.ethnicity !== null && user.ethnicity !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.ethnicity = true;
  }
  if (user.feetType !== null && user.feetType !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.feetType = true;
  }
  if (user.education !== null && user.education !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.education = true;
  }
  if (user.occupation !== null && user.occupation !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.occupation = true;
  }
  if (user.politics !== null && user.politics !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.politics = true;
  }
  if (user.religion !== null && user.religion !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.religion = true;
  }
  if (user.foods !== null && user.foods !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.foods = true;
  }
  if (user.livesWith !== null && user.livesWith !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.livesWith = true;
  }
  if (user.roleInLife !== null && user.roleInLife !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.roleInLife = true;
  }
  if (user.managesEdu !== null && user.managesEdu !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.managesEdu = true;
  }
  if (user.marriage !== null && user.marriage !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.marriage = true;
  }
  if (user.income !== null && user.income !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.income = true;
  }
  if (user.ageOfPartner !== null && user.ageOfPartner !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.ageOfPartner = true;
  }
  if (user.changes !== null && user.changes !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.changes = true;
  }
  if (user.relocate !== null && user.relocate !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.relocate = true;
  }
  if (user.sexLikes !== null && user.sexLikes !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.sexLikes = true;
  }
  if (user.sexFrequency !== null && user.sexFrequency !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.sexFrequency = true;
  }
  if (user && user.loves.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.loves = true;
  }
  if (user && user.hates.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hates = true;
  }
  if (user && user.pets.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.pets = true;
  }
  if (user && user.interests.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.interests = true;
  }
  if (user && user.music.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.music = true;
  }
  if (user && user.books.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.books = true;
  }
  if (user && user.films.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.films = true;
  }
  if (user && user.sports.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.sports = true;
  }
  if (user && user.hobbies.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hobbies = true;
  }
  if (user && user.traits.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.traits = true;
  }
  if (user && user.treatSelf.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.treatSelf = true;
  }
  res.json(completion);
};

exports.pointsData = async (req, res) => {
  const user = await User.findById(req.body.id).select(
    'pointsGained pointsLost pointsSpent'
  );
  const pointsData = {};

  const sumPointsGained = user.pointsGained.reduce(
    (sum, point) => sum + point.amount,
    0
  );
  const sumPointsLost = user.pointsLost.reduce(
    (sum, point) => sum + point.amount,
    0
  );
  const sumPointsSpent = user.pointsSpent.reduce(
    (sum, point) => sum + point.amount,
    0
  );
  pointsData.sumPointsGained = sumPointsGained;
  pointsData.sumPointsLost = sumPointsLost;
  pointsData.sumPointsSpent = sumPointsSpent;

  res.json(pointsData);
};

exports.updateUserProgress = async (req, res) => {
  const user = await User.findById(req.body._id).select(
    'coverImage profileImage username name gender about birthday location genderWanted relWanted language maritalStatus numOfChildren drinks smokes nationality height build hairColor hairStyle hairLength eyeColor ethnicity feetType education occupation politics religion foods livesWith roleInLife managesEdu marriage income ageOfPartner changes relocate sexLikes sexFrequency loves hates pets interests music books films sports hobbies traits treatSelf'
  );

  let completion = {
    percentage: 0,
  };

  if (user.coverImage !== null && user.coverImage !== undefined) {
    completion.percentage = completion.percentage + 3;
  } else {
    completion.coverImage = true;
  }
  if (user.profileImage !== null && user.profileImage !== undefined) {
    completion.percentage = completion.percentage + 3;
  } else {
    completion.profileImage = true;
  }
  if (user.name !== null && user.name !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.name = true;
  }
  if (user.gender !== null && user.gender !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.gender = true;
  }
  if (user.about !== null && user.about !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.about = true;
  }
  if (user.birthday !== null && user.birthday !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.birthday = true;
  }
  if (user.location !== null && user.location !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.location = true;
  }
  if (user.genderWanted !== null && user.genderWanted !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.genderWanted = true;
  }
  if (user.relWanted !== null && user.relWanted !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.relWanted = true;
  }
  if (user.language !== null && user.language !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.language = true;
  }
  if (user.maritalStatus !== null && user.maritalStatus !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.maritalStatus = true;
  }
  if (user.numOfChildren !== null && user.numOfChildren !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.numOfChildren = true;
  }
  if (user.drinks !== null && user.drinks !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.drinks = true;
  }
  if (user.smokes !== null && user.smokes !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.smokes = true;
  }
  if (user.nationality !== null && user.nationality !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.nationality = true;
  }
  if (user.height !== null && user.height !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.height = true;
  }
  if (user.build !== null && user.build !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.build = true;
  }
  if (user.hairColor !== null && user.hairColor !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hairColor = true;
  }
  if (user.hairStyle !== null && user.hairStyle !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hairStyle = true;
  }
  if (user.hairLength !== null && user.hairLength !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hairLength = true;
  }
  if (user.eyeColor !== null && user.eyeColor !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.eyeColor = true;
  }
  if (user.ethnicity !== null && user.ethnicity !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.ethnicity = true;
  }
  if (user.feetType !== null && user.feetType !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.feetType = true;
  }
  if (user.education !== null && user.education !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.education = true;
  }
  if (user.occupation !== null && user.occupation !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.occupation = true;
  }
  if (user.politics !== null && user.politics !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.politics = true;
  }
  if (user.religion !== null && user.religion !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.religion = true;
  }
  if (user.foods !== null && user.foods !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.foods = true;
  }
  if (user.livesWith !== null && user.livesWith !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.livesWith = true;
  }
  if (user.roleInLife !== null && user.roleInLife !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.roleInLife = true;
  }
  if (user.managesEdu !== null && user.managesEdu !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.managesEdu = true;
  }
  if (user.marriage !== null && user.marriage !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.marriage = true;
  }
  if (user.income !== null && user.income !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.income = true;
  }
  if (user.ageOfPartner !== null && user.ageOfPartner !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.ageOfPartner = true;
  }
  if (user.changes !== null && user.changes !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.changes = true;
  }
  if (user.relocate !== null && user.relocate !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.relocate = true;
  }
  if (user.sexLikes !== null && user.sexLikes !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.sexLikes = true;
  }
  if (user.sexFrequency !== null && user.sexFrequency !== undefined) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.sexFrequency = true;
  }
  if (user && user.loves.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.loves = true;
  }
  if (user && user.hates.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hates = true;
  }
  if (user && user.pets.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.pets = true;
  }
  if (user && user.interests.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.interests = true;
  }
  if (user && user.music.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.music = true;
  }
  if (user && user.books.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.books = true;
  }
  if (user && user.films.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.films = true;
  }
  if (user && user.sports.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.sports = true;
  }
  if (user && user.hobbies.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.hobbies = true;
  }
  if (user && user.traits.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.traits = true;
  }
  if (user && user.treatSelf.length > 0) {
    completion.percentage = completion.percentage + 2;
  } else {
    completion.treatSelf = true;
  }

  const updateProgress = await User.findByIdAndUpdate(user._id, {
    $set: { profilePercentage: completion.percentage },
  });

  if (completion.percentage == 100) {
    const complete = await User.findByIdAndUpdate(user._id, {
      profileComplete: true,
    });
  }
};

exports.followingData = async (req, res) => {
  const user = await User.findById(req.body.id)
    .select('following')
    .populate('following', '_id name email profileImage username');

  res.json(user);
};

exports.followersData = async (req, res) => {
  const user = await User.findById(req.body.id)
    .select('followers')
    .populate('followers', '_id name email profileImage username');

  res.json(user);
};

exports.visitorsData = async (req, res) => {
  const user = await User.findById(req.body.id)
    .select('visitors')
    .populate('visitors', '_id name email profileImage username');

  res.json(user);
};

exports.ordersData = async (req, res) => {
  const user = await User.findById(req.body.id);
  const userOrders = await Order.find({ orderedBy: user._id })
    .sort('-createdAt')
    .populate('products.product')
    .populate('orderedBy', 'username email')
    .exec();
  res.json(userOrders);
};

exports.gcSentData = async (req, res) => {
  const user = await User.findById(req.body.id);
  const gcSent = await GiftCard.find({ from: user._id })
    .sort('-createdAt')
    .select('from to amount')
    .populate('from', '_id name username email profileImage')
    .populate('to', '_id name username email profileImage')
    .exec();
  res.json(gcSent);
};

exports.gcReceivedData = async (req, res) => {
  const user = await User.findById(req.body.id);
  const gcReceived = await GiftCard.find({ to: user._id })
    .sort('-createdAt')
    .select('from to amount')
    .populate('from', '_id name username email profileImage')
    .populate('to', '_id name username email profileImage')
    .exec();
  res.json(gcReceived);
};

exports.usersForAnalytics = async (req, res) => {
  const users = await User.find({})
    .select(
      `username gender birthday age location genderWanted relWanted language createdAt visits lastLogin maritalStatus numOfChildren
    drinks smokes nationality height build hairColor hairStyle hairLength eyeColor ethnicity feetType education occupation about
    religion music foods hobbies books films sports livesWith ageOfPartner treatSelf productsViewed pointsTotal orders itemsOrderedValue`
    )
    .populate('productsViewed.item', 'title');
  const removeAdmin = users.filter((u) => u._id != '63dc1d2a8eb01e4110743044');
  res.json(removeAdmin);
};
