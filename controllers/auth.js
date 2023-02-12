const User = require('../models/user');
const Post = require('../models/post');
const Location = require('../models/location');
const CallingCode = require('../models/callingCode');
const Chat = require('../models/chat');
const Message = require('../models/message');
const Event = require('../models/event');
const Order = require('../models/order');
const Blocked = require('../models/blocked');
const Verif = require('../models/verif');
const { nanoid } = require('nanoid');
const { json } = require('express');
const cloudinary = require('cloudinary');
const Cardinity = require('cardinity-nodejs');

const admin = require('../firebase');

const Client = Cardinity.client();
const Refund = Cardinity.refund();

const client = new Client(
  process.env.CARDINITY_KEY,
  process.env.CARDINITY_SECRET
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

exports.userExists = async (req, res) => {
  const { mobile } = req.params;
  const user = await User.find({
    $or: [{ mobile }, { secondMobile: mobile }],
  }).select('_id');
  res.json(user);
};

exports.usernameExists = async (req, res) => {
  const { username } = req.params;
  const user = await User.find({ username }).select('_id');
  res.json(user);
};

exports.secondMobileExists = async (req, res) => {
  const { secondMobile } = req.params;
  const user = await User.find({
    $or: [{ mobile: secondMobile }, { secondMobile }],
  }).select('_id');
  res.json(user);
};

exports.emailExists = async (req, res) => {
  const { email } = req.params;
  const user = await User.find({ email }).select('_id');
  res.json(user);
};

exports.userPermitted = async (req, res) => {
  const { mobile } = req.params;
  const user = await User.find({
    $or: [{ mobile }, { secondMobile: mobile }],
  }).select('username name profileImage _id userStatus');
  res.json(user);
};

exports.userBlocked = async (req, res) => {
  const { mobile } = req.params;
  const user = await Blocked.find({ mobile });
  res.json(user);
};

exports.secondMobileBlocked = async (req, res) => {
  const { secondMobile } = req.params;
  const user = await Blocked.find({ secondMobile });
  res.json(user);
};

exports.callingCode = async (req, res) => {
  const { mobile } = req.params;
  const callingCode1 = mobile.slice(0, 5);
  const callingCode2 = mobile.slice(0, 4);
  const callingCode3 = mobile.slice(0, 3);
  const callingCode4 = mobile.slice(0, 2);

  const allCodes = await CallingCode.find({});

  var code1 = allCodes.some((c) => c.callingCode === callingCode1);
  var code2 = allCodes.some((c) => c.callingCode === callingCode2);
  var code3 = allCodes.some((c) => c.callingCode === callingCode3);
  var code4 = allCodes.some((c) => c.callingCode === callingCode4);

  if (code1) {
    const country = await CallingCode.findOne({
      callingCode: callingCode1,
    }).select('permitted');
    return res.json(country);
  } else if (code2) {
    const country = await CallingCode.findOne({
      callingCode: callingCode2,
    }).select('permitted');
    return res.json(country);
  } else if (code3) {
    const country = await CallingCode.findOne({
      callingCode: callingCode3,
    }).select('permitted');
    return res.json(country);
  } else if (code4) {
    const country = await CallingCode.findOne({
      callingCode: callingCode4,
    }).select('permitted');
    return res.json(country);
  } else return res.json({ permitted: 'false' });
};

exports.secondMobileCallingCode = async (req, res) => {
  const { secondMobile } = req.params;
  const callingCode1 = secondMobile.slice(0, 5);
  const callingCode2 = secondMobile.slice(0, 4);
  const callingCode3 = secondMobile.slice(0, 3);
  const callingCode4 = secondMobile.slice(0, 2);

  const allCodes = await CallingCode.find({});

  var code1 = allCodes.some((c) => c.callingCode === callingCode1);
  var code2 = allCodes.some((c) => c.callingCode === callingCode2);
  var code3 = allCodes.some((c) => c.callingCode === callingCode3);
  var code4 = allCodes.some((c) => c.callingCode === callingCode4);

  if (code1) {
    const country = await CallingCode.findOne({
      callingCode: callingCode1,
    }).select('permitted');
    return res.json(country);
  } else if (code2) {
    const country = await CallingCode.findOne({
      callingCode: callingCode2,
    }).select('permitted');
    return res.json(country);
  } else if (code3) {
    const country = await CallingCode.findOne({
      callingCode: callingCode3,
    }).select('permitted');
    return res.json(country);
  } else if (code4) {
    const country = await CallingCode.findOne({
      callingCode: callingCode4,
    }).select('permitted');
    return res.json(country);
  } else return res.json({ permitted: 'false' });
};

exports.checkCredentials = async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email }).select('statement answer');
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

exports.createUser = async (req, res) => {
  const { name, email, mobile, secondMobile, statement, answer } = req.body;
  const username = req.body.username || nanoid(6);
  const content = `Hi ${name}, welcome to Love Is In Cyprus! We're so glad to have you here. Don't forget to update your profile to increase your chances of making more connections. Just click on your avatar above to get started. We wish you all the best in finding your perfect partner!`;
  const newUser = await new User({
    name,
    username,
    email,
    mobile,
    secondMobile,
    statement,
    answer,
    membership: { paid: true, expiry: new Date('June 30, 2023 23:59:59') },
  }).save();

  const sender = await User.findOne({ _id: '63dc1d2a8eb01e4110743044' }).select(
    'name username email profileImage'
  );
  const chat = await new Chat({
    users: [sender._id, newUser._id],
  }).save();

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

    const updateLatest = await Chat.findOneAndUpdate(
      { _id: chat._id },
      {
        latestMessage: message,
      }
    );

    const notifyReceiver = await User.findByIdAndUpdate(
      { _id: newUser._id },
      {
        $push: {
          messages: message,
        },
      },
      { new: true }
    ).select(
      '_id membership messages newNotifs name email mobile secondMobile statement answer following followers matches profileImage username'
    );
    res.json(notifyReceiver);
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
};

exports.loginUser = async (req, res) => {
  const { mobile, email } = req.body;
  const user = await User.findOneAndUpdate(
    { $or: [{ mobile }, { email }] },
    { lastLogin: new Date(Date.now()) }
  ).select(
    '_id membership messages newNotifs name email mobile secondMobile statement answer following followers matches profileImage username role'
  );

  if (
    user &&
    user.membership.paid &&
    user.membership.trialPeriod &&
    user.membership.startDate.getTime() + 14 * 24 * 3600 * 1000 < Date.now()
  ) {
    const refund = new Refund({
      amount: user.membership.cost,
      description: 'User did not make use of their subscription',
      id: user.membership.cardinityId,
    });

    client
      .call(refund)
      .then(async (response) => {
        const subscriptionUnpaid = await User.findByIdAndUpdate(
          { _id: user._id },
          {
            'membership.paid': false,
            'membership.trialPeriod': false,
          },
          { new: true }
        )
          .select(
            '_id membership messages newNotifs name email mobile secondMobile statement answer following followers matches profileImage username role'
          )
          .exec();

        res.json(subscriptionUnpaid);
      })
      .catch((err) => {
        console.log(err);
      });
  } else if (
    user &&
    user.membership.paid &&
    user.membership.trialPeriod &&
    user.membership.startDate.getTime() + 14 * 24 * 3600 * 1000 > Date.now()
  ) {
    const trialEnded = await User.findByIdAndUpdate(
      { _id: user._id },
      { 'membership.trialPeriod': false },
      { new: true }
    )
      .select(
        '_id membership messages newNotifs name email mobile secondMobile statement answer following followers matches profileImage username role'
      )
      .exec();
    res.json(trialEnded);
  } else if (user) {
    res.json(user);
  } else {
    return res.status(400).send('User not found');
  }
};

exports.loginUserWithSecret = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOneAndUpdate(
    { email },
    { lastLogin: new Date(Date.now()) }
  ).select(
    '_id membership messages newNotifs name email mobile secondMobile statement answer following followers matches profileImage username role'
  );

  if (
    user &&
    user.membership.paid &&
    user.membership.trialPeriod &&
    user.membership.startDate.getTime() + 14 * 24 * 3600 * 1000 < Date.now()
  ) {
    const refund = new Refund({
      amount: user.membership.cost,
      description: 'User did not make use of their subscription',
      id: user.membership.cardinityId,
    });

    client
      .call(refund)
      .then(async (response) => {
        const subscriptionUnpaid = await User.findByIdAndUpdate(
          { _id: user._id },
          {
            'membership.paid': false,
            'membership.trialPeriod': false,
          },
          { new: true }
        )
          .select(
            '_id membership messages newNotifs name email mobile secondMobile statement answer following followers matches profileImage username role'
          )
          .exec();

        res.json(subscriptionUnpaid);
      })
      .catch((err) => {
        console.log(err);
      });
  } else if (
    user &&
    user.membership.paid &&
    user.membership.trialPeriod &&
    user.membership.startDate.getTime() + 14 * 24 * 3600 * 1000 > Date.now()
  ) {
    const trialEnded = await User.findByIdAndUpdate(
      { _id: user._id },
      { 'membership.trialPeriod': false },
      { new: true }
    )
      .select(
        '_id membership messages newNotifs name email mobile secondMobile statement answer following followers matches profileImage username role'
      )
      .exec();
    res.json(trialEnded);
  } else if (user) {
    res.json(user);
  } else {
    return res.status(400).send('User not found');
  }
};

exports.updateMobileNumbers = async (req, res) => {
  const { email, mobile } = req.body;

  try {
    const user = await User.findOne({ email, secondMobile: mobile }).select(
      'mobile'
    );
    const updateUser = await User.findOneAndUpdate(
      { email, secondMobile: mobile },
      { mobile, secondMobile: '' },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

exports.updateFirestoreUser = async (req, res) => {
  const { prevMobile, mobile } = req.body;
  try {
    const firebaseUser = await admin.auth().getUserByPhoneNumber(prevMobile);
    const updatedUser = await admin.auth().updateUser(firebaseUser.uid, {
      phoneNumber: mobile,
    });
    res.json(updatedUser);
  } catch (err) {
    console.log(err);
  }
};

exports.currentUser = async (req, res) => {
  User.findOne({ mobile: req.user.phone_number }).exec((err, user) => {
    if (err) throw new Error(err);
    res.json(user);
  });
};

exports.checkInfoExists = async (req, res) => {
  const { _id, mobile, updatedMobile, secondMobile, updatedEmail } = req.body;
  if (updatedMobile && secondMobile) {
    const users = await User.find({
      $or: [
        { mobile: updatedMobile },
        { mobile: secondMobile },
        { secondMobile: updatedMobile },
        { secondMobile },
        { email: updatedEmail },
      ],
      _id: { $ne: _id },
    }).select('_id mobile secondMobile email');
    res.json(users);
  } else if (updatedMobile) {
    const users = await User.find({
      $or: [
        { mobile: updatedMobile },
        { secondMobile: updatedMobile },
        { email: updatedEmail },
      ],
      _id: { $ne: _id },
    }).select('_id mobile secondMobile email');
    res.json(users);
  } else if (secondMobile) {
    const users = await User.find({
      $or: [
        { mobile },
        { mobile: secondMobile },
        { secondMobile },
        { secondMobile: mobile },
        { email: updatedEmail },
      ],
      _id: { $ne: _id },
    }).select('_id mobile secondMobile email');
    res.json(users);
  } else {
    const users = await User.find({
      $or: [{ mobile }, { secondMobile: mobile }, { email: updatedEmail }],
      _id: { $ne: _id },
    }).select('_id mobile secondMobile email');
    res.json(users);
  }
};

exports.profileUpdate = async (req, res) => {
  try {
    const data = {};
    if (req.body.updatedMobile) {
      const firebaseUser = await admin
        .auth()
        .getUserByPhoneNumber(req.body.mobile);
      const updatedUser = await admin
        .auth()
        .updateUser(firebaseUser.uid, {
          phoneNumber: req.body.updatedMobile,
        })
        .then((userRecord) => {
          console.log('Successfully updated user', userRecord.toJSON());
        })
        .catch((error) => {
          console.log('Error updating user:', error);
          return res.json(error);
        });
      data.mobile = req.body.updatedMobile;
    }
    if (req.body.username) {
      data.username = req.body.username;
    }
    if (req.body.about) {
      data.about = req.body.about;
    }
    if (req.body.name) {
      data.name = req.body.name;
    }
    if (req.body.secondMobile) {
      data.secondMobile = req.body.secondMobile;
    }
    if (req.body.statement) {
      data.statement = req.body.statement;
    }
    if (req.body.updatedAnswer) {
      data.answer = req.body.updatedAnswer;
    }
    if (req.body.updatedEmail) {
      data.email = req.body.updatedEmail;
    }
    if (req.body.profileImage) {
      data.profileImage = req.body.profileImage;
    }
    if (req.body.coverImage) {
      data.coverImage = req.body.coverImage;
    }
    if (req.body.gender) {
      data.gender = req.body.gender;
    }
    if (req.body.birthday) {
      data.birthday = req.body.birthday;
      function calculate_age(dob) {
        var diff_ms = Date.now() - dob.getTime();
        var age_dt = new Date(diff_ms);
        return Math.abs(age_dt.getUTCFullYear() - 1970);
      }
      data.age = calculate_age(new Date(req.body.birthday));
    }
    if (req.body.location) {
      data.location = req.body.location;
    }
    if (req.body.genderWanted) {
      data.genderWanted = req.body.genderWanted;
    }
    if (req.body.relWanted) {
      data.relWanted = req.body.relWanted;
    }
    if (req.body.language) {
      data.language = req.body.language;
    }
    if (req.body.maritalStatus) {
      data.maritalStatus = req.body.maritalStatus;
    }
    if (req.body.numOfChildren) {
      data.numOfChildren = req.body.numOfChildren;
    }
    if (req.body.drinks) {
      data.drinks = req.body.drinks;
    }
    if (req.body.smokes) {
      data.smokes = req.body.smokes;
    }
    if (req.body.nationality) {
      data.nationality = req.body.nationality;
    }
    if (req.body.height) {
      data.height = req.body.height;
    }
    if (req.body.build) {
      data.build = req.body.build;
    }
    if (req.body.hairColor) {
      data.hairColor = req.body.hairColor;
    }
    if (req.body.hairStyle) {
      data.hairStyle = req.body.hairStyle;
    }
    if (req.body.hairLength) {
      data.hairLength = req.body.hairLength;
    }
    if (req.body.eyeColor) {
      data.eyeColor = req.body.eyeColor;
    }
    if (req.body.ethnicity) {
      data.ethnicity = req.body.ethnicity;
    }
    if (req.body.feetType) {
      data.feetType = req.body.feetType;
    }
    if (req.body.loves) {
      data.loves = req.body.loves;
    }
    if (req.body.hates) {
      data.hates = req.body.hates;
    }
    if (req.body.education) {
      data.education = req.body.education;
    }
    if (req.body.occupation) {
      data.occupation = req.body.occupation;
    }
    if (req.body.politics) {
      data.politics = req.body.politics;
    }
    if (req.body.religion) {
      data.religion = req.body.religion;
    }
    if (req.body.pets) {
      data.pets = req.body.pets;
    }
    if (req.body.interests) {
      data.interests = req.body.interests;
    }
    if (req.body.music) {
      data.music = req.body.music;
    }
    if (req.body.foods) {
      data.foods = req.body.foods;
    }
    if (req.body.books) {
      data.books = req.body.books;
    }
    if (req.body.films) {
      data.films = req.body.films;
    }
    if (req.body.sports) {
      data.sports = req.body.sports;
    }
    if (req.body.livesWith) {
      data.livesWith = req.body.livesWith;
    }
    if (req.body.roleInLife) {
      data.roleInLife = req.body.roleInLife;
    }
    if (req.body.managesEdu) {
      data.managesEdu = req.body.managesEdu;
    }
    if (req.body.hobbies) {
      data.hobbies = req.body.hobbies;
    }
    if (req.body.marriage) {
      data.marriage = req.body.marriage;
    }
    if (req.body.income) {
      data.income = req.body.income;
    }
    if (req.body.ageOfPartner) {
      data.ageOfPartner = req.body.ageOfPartner;
    }
    if (req.body.traits) {
      data.traits = req.body.traits;
    }
    if (req.body.changes) {
      data.changes = req.body.changes;
    }
    if (req.body.relocate) {
      data.relocate = req.body.relocate;
    }
    if (req.body.treatSelf) {
      data.treatSelf = req.body.treatSelf;
    }
    if (req.body.sexLikes) {
      data.sexLikes = req.body.sexLikes;
    }
    if (req.body.sexFrequency) {
      data.sexFrequency = req.body.sexFrequency;
    }

    let user = await User.findByIdAndUpdate(req.body.user._id, data, {
      new: true,
    }).select(
      `username about name email mobile secondMobile statement answer profileImage coverImage gender birthday age location genderWanted relWanted language
       maritalStatus numOfChildren drinks smokes nationality height build hairColor hairStyle hairLength eyeColor ethnicity
       feetType loves hates education occupation politics religion pets interests music foods books films sports livesWith
       roleInLife managesEdu hobbies marriage income ageOfPartner traits changes relocate treatSelf sexLikes sexFrequency`
    );

    if (req.body.profileImage) {
      let user1 = await User.findByIdAndUpdate(
        req.body.user._id,
        {
          $addToSet: {
            profilePhotos: req.body.profileImage.url,
          },
        },
        {
          new: true,
        }
      );
    }
    if (req.body.coverImage) {
      let user2 = await User.findByIdAndUpdate(
        req.body.user._id,
        {
          $addToSet: {
            coverPhotos: req.body.coverImage.url,
          },
        },
        {
          new: true,
        }
      );
    }
    res.json(user);
  } catch (err) {
    if (err.code == 11000) {
      return res.json({ error: 'This username has already been taken' });
    }
  }
};

exports.findUsers = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id).select('_id following');
    let following = user.following;
    following.push(user._id);
    const users = await User.aggregate([
      { $match: { _id: { $nin: following } } },
      { $sample: { size: 5 } },
      {
        $project: {
          _id: 1,
          name: 1,
          username: 1,
          email: 1,
          profileImage: 1,
        },
      },
    ]);
    res.json(users);
  } catch (err) {
    console.log('findUsers => ', err);
  }
};

exports.userFollow = async (req, res) => {
  try {
    const check = await User.findById(req.body.u._id).select('following');

    if (check.following.includes(req.body.user._id)) {
      const user = await User.findByIdAndUpdate(
        req.body.user._id,
        {
          $addToSet: {
            following: req.body.u._id,
            matches: req.body.u._id,
          },
        },
        { new: true }
      )
        .populate('following', '_id name email profileImage username')
        .populate('followers', '_id name email profileImage username');
      const otherUser = await User.findByIdAndUpdate(
        req.body.u._id,
        {
          $addToSet: {
            matches: req.body.user._id,
          },
        },
        { new: true }
      );
      res.json(user);
    } else {
      const user = await User.findByIdAndUpdate(
        req.body.user._id,
        {
          $addToSet: {
            following: req.body.u._id,
          },
        },
        { new: true }
      )
        .populate('following', '_id name email profileImage username')
        .populate('followers', '_id name email profileImage username');
      res.json(user);
    }
    const notify = await User.findByIdAndUpdate(
      req.body.u._id,
      {
        $push: {
          notifications: {
            notif: {
              follower: req.body.user._id,
              name: req.body.user.name,
              email: req.body.user.email,
              username: req.body.user.username,
              profileImage: req.body.user.profileImage,
            },
            action: 'user liked you',
          },
        },
      },
      { new: true }
    );
    const sendNotif = await User.findByIdAndUpdate(
      req.body.u._id,
      {
        $addToSet: {
          newNotifs: {
            action: 'Somebody likes you',
            id: req.body.user._id,
          },
        },
      },
      { new: true }
    );
  } catch (err) {
    console.log('userFollow => ', err);
  }
};

exports.userUnfollow = async (req, res) => {
  try {
    const check = await User.findById(req.body.u._id).select('following');

    if (check.following.includes(req.body.user._id)) {
      const user = await User.findByIdAndUpdate(
        req.body.user._id,
        {
          $pull: {
            following: req.body.u._id,
            matches: req.body.u._id,
          },
        },
        { new: true }
      )
        .populate('following', '_id name email profileImage username')
        .populate('followers', '_id name email profileImage username');
      const otherUser = await User.findByIdAndUpdate(
        req.body.u._id,
        {
          $pull: {
            matches: req.body.user._id,
          },
        },
        { new: true }
      );
      res.json(user);
    } else {
      const user = await User.findByIdAndUpdate(
        req.body.user._id,
        {
          $pull: {
            following: req.body.u._id,
          },
        },
        { new: true }
      )
        .populate('following', '_id name email profileImage username')
        .populate('followers', '_id name email profileImage username');
      res.json(user);
    }
  } catch (err) {
    console.log('userUnfollow => ', err);
  }
};

exports.userFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.body._id).select('following');
    const following = await User.find({ _id: user.following }).select(
      '_id name email username profileImage'
    );
    res.json(following);
  } catch (err) {
    console.log('userFollowing => ', err);
  }
};

exports.userFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id).select('followers');
    const followers = await User.find({ _id: user.followers }).select(
      '_id name email username profileImage'
    );
    res.json(followers);
  } catch (err) {
    console.log('userFollowers => ', err);
  }
};

exports.userMatches = async (req, res) => {
  try {
    const user = await User.findById(req.body._id).select('matches');
    const matches = await User.find({ _id: user.matches })
      .select('_id name email username profileImage')
      .exec();
    res.json(matches);
  } catch (err) {
    console.log('userMatches => ', err);
  }
};

exports.userVisitors = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id).select('visitors');
    const visitors = await User.find({ _id: user.visitors })
      .select('_id name email username profileImage')
      .exec();
    res.json(visitors);
  } catch (err) {
    console.log('userVisitors => ', err);
  }
};

exports.nineMatches = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id).select('matches');
    let matches = user.matches;
    const users = await User.aggregate([
      { $match: { _id: { $in: matches } } },
      { $sample: { size: 9 } },
      {
        $project: {
          _id: 1,
          name: 1,
          username: 1,
          email: 1,
          profileImage: 1,
        },
      },
    ]);
    res.json(users);
  } catch (err) {
    console.log('nineMatches => ', err);
  }
};

exports.searchUser = async (req, res) => {
  const { query } = req.params;

  if (!query) return;
  try {
    const user = await User.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
      ],
    }).select(
      '_id name email profileImage featuredMember role pointsGained pointsLost pointsSpent username userStatus mobile eventsEligible canVerify canReported canPosts canUsers canMassMail canEvents canOrders canProducts canCategories canSubs canCoupon'
    );
    res.json(user);
  } catch (err) {
    console.log('searchUser => ', err);
  }
};

exports.userProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const thisUser = await User.findById(userId).select(
      '_id username about name email mobile secondMobile statement answer profileImage coverImage gender birthday age location genderWanted relWanted language maritalStatus numOfChildren drinks smokes nationality height build hairColor hairStyle hairLength eyeColor ethnicity feetType loves hates education occupation politics religion pets interests music foods books films sports livesWith roleInLife managesEdu hobbies marriage income ageOfPartner traits changes relocate treatSelf sexLikes sexFrequency createdAt following verified clearPhoto membership lastLogin'
    );
    res.json(thisUser);
  } catch (err) {
    console.log('userProfile => ', err);
  }
};

exports.cropCover = async (req, res) => {
  try {
    if (req.body.croppedCover !== null) {
      const result = await cloudinary.uploader.upload(req.body.croppedCover);
      const user = await User.findByIdAndUpdate(
        req.body.user._id,
        {
          $push: {
            coverPhotos: result.secure_url,
          },
        },
        { new: true }
      ).select('coverPhotos');
      res.json({
        url: result.secure_url,
        public_id: result.public_id,
      });
    }
  } catch (err) {
    console.log('cropCover => ', err);
  }
};

exports.cropProfile = async (req, res) => {
  try {
    if (req.body.croppedProfile) {
      const result = await cloudinary.uploader.upload(req.body.croppedProfile);
      const user = await User.findByIdAndUpdate(
        req.body.user._id,
        {
          $push: {
            profilePhotos: result.secure_url,
          },
        },
        { new: true }
      ).select('profilePhotos');
      res.json({
        url: result.secure_url,
        public_id: result.public_id,
      });
    }
  } catch (err) {
    console.log('cropProfile => ', err);
  }
};

exports.liveProfilePic = async (req, res) => {
  try {
    if (req.body.url) {
      const result = await cloudinary.uploader.upload(req.body.url);
      const user = await User.findByIdAndUpdate(
        req.body.user._id,
        {
          $push: {
            profilePhotos: result.secure_url,
          },
        },
        { new: true }
      ).select('profilePhotos');
      res.json({
        url: result.secure_url,
        public_id: result.public_id,
      });
    }
  } catch (err) {
    console.log('cropProfile => ', err);
  }
};

exports.users = async (req, res) => {
  const currentPage = req.params.page || 1;
  const perPage = 12;
  try {
    const users = await User.find({})
      .select(
        '_id name email profileImage featuredMember role pointsGained pointsLost pointsSpent username userStatus mobile eventsEligible canVerify canReported canPosts canUsers canMassMail canEvents canOrders canProducts canCategories canSubs canCoupon'
      )
      .limit(currentPage * perPage);
    res.json(users);
  } catch (err) {
    console.log('users => ', err);
  }
};

exports.suspendUser = async (req, res) => {
  const { _id, endDate, reason } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      _id,
      {
        userStatus: { suspended: true, until: endDate, reason },
      },
      { new: true }
    ).select('userStatus');
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

exports.revokeUser = async (req, res) => {
  const { _id } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      _id,
      {
        userStatus: { suspended: false, until: '', reason: '' },
      },
      { new: true }
    ).select('userStatus');
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { u } = req.body;
    const user = await User.findByIdAndDelete(u._id);
    const posts = await Post.deleteMany({ postedBy: u._id });
    const comments = await Post.updateMany({
      $pull: { comments: { postedBy: u._id } },
    });
    const likes = await Post.updateMany({ $pull: { likes: u._id } });
    const followers = await User.updateMany({ $pull: { followers: u._id } });
    const following = await User.updateMany({ $pull: { following: u._id } });
    const matches = await User.updateMany({ $pull: { matches: u._id } });
    const visitors = await User.updateMany({ $pull: { visitors: u._id } });
    const accepted = await Event.updateMany({ $pull: { accepted: u._id } });
    const maybe = await Event.updateMany({ $pull: { maybe: u._id } });
    const declined = await Event.updateMany({ $pull: { declined: u._id } });
    const chats = await Chat.deleteMany({ users: { $in: [u._id] } });
    const verifs = await Verif.remove({ postedBy: u._id });
    const blocked = await new Blocked({
      mobile: u.mobile,
      secondMobile: u.secondMobile,
    }).save();
    res.json({ ok: true });
  } catch (err) {
    console.log('deleteUser => ', err);
  }
};

exports.deleteSelf = async (req, res) => {
  try {
    const { user } = req.body;
    const self = await User.findByIdAndDelete(user._id);
    const posts = await Post.deleteMany({ postedBy: user._id });
    const comments = await Post.updateMany({
      $pull: { comments: { postedBy: user._id } },
    });
    const likes = await Post.updateMany({ $pull: { likes: user._id } });
    const followers = await User.updateMany({ $pull: { followers: user._id } });
    const following = await User.updateMany({ $pull: { following: user._id } });
    const matches = await User.updateMany({ $pull: { matches: user._id } });
    const visitors = await User.updateMany({ $pull: { visitors: user._id } });
    const accepted = await Event.updateMany({ $pull: { accepted: user._id } });
    const maybe = await Event.updateMany({ $pull: { maybe: user._id } });
    const declined = await Event.updateMany({ $pull: { declined: user._id } });
    const chats = await Chat.deleteMany({ users: { $in: [user._id] } });
    const verifs = await Verif.remove({ postedBy: user._id });
    res.json({ ok: true });
  } catch (err) {
    console.log('deleteUser => ', err);
  }
};

exports.recentUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('_id name email username profileImage')
      .sort({ createdAt: -1 })
      .limit(6);
    res.json(users);
  } catch (err) {
    console.log('recentUsers => ', err);
  }
};

exports.recentOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
    res.json(orders);
  } catch (err) {
    console.log('recentOrders => ', err);
  }
};

exports.usersToSwipe = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id).select(
      '_id nopes following genderWanted'
    );
    const genderUnwanted = await User.find({
      gender: { $ne: user.genderWanted },
    }).select('_id');
    let usersUnavailable = user.following;
    usersUnavailable.push(user._id);
    if (user.nopes.length > 0) {
      user.nopes.map((nope) => usersUnavailable.push(nope._id));
    }
    genderUnwanted.map((gu) => usersUnavailable.push(gu._id));

    const users = await User.find({ _id: { $nin: usersUnavailable } })
      .limit(5)
      .select('_id name email profileImage age username');
    res.json(users);
  } catch (err) {
    console.log('usersToSwipe => ', err);
  }
};

exports.leftSwipe = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.body.user._id, {
    $addToSet: {
      nopes: req.body.u._id,
    },
  }).select('nopes');
  res.json(user);
};

exports.fetchVisitor = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.body.userId, {
    $addToSet: {
      visitors: req.body.user._id,
    },
  }).select('_id name email username profileImage visitors');
  if (!user.visitors.includes(req.body.user._id)) {
    const notify = await User.findByIdAndUpdate(
      req.body.userId,
      {
        $push: {
          notifications: {
            notif: {
              visitor: req.body.user._id,
              name: req.body.user.name,
              email: req.body.user.email,
              username: req.body.user.username,
              profileImage: req.body.user.profileImage,
            },
            action: 'user visited you',
          },
        },
      },
      { new: true }
    );
    const sendNotif = await User.findByIdAndUpdate(
      req.body.userId,
      {
        $addToSet: {
          newNotifs: {
            action: 'Somebody visited your profile',
            id: req.body.user._id,
          },
        },
      },
      { new: true }
    );
  }
  res.json(user);
};

exports.nineVisitors = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id).select('visitors');
    let visitors = user.visitors;
    const users = await User.aggregate([
      { $match: { _id: { $in: visitors } } },
      { $sample: { size: 9 } },
      {
        $project: {
          _id: 1,
          name: 1,
          username: 1,
          email: 1,
          profileImage: 1,
        },
      },
    ]);
    res.json(users);
  } catch (err) {
    console.log('nineVisitors => ', err);
  }
};

exports.ninePhotos = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id).select(
      'profilePhotos coverPhotos uploadedPhotos'
    );
    let photos = [];
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
    let random = merged.sort(() => 0.5 - Math.random()).slice(0, 9);
    res.json(random);
  } catch (err) {
    console.log(err);
  }
};

exports.usersNinePhotos = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId).select(
      'profilePhotos coverPhotos uploadedPhotos'
    );
    let photos = [];
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
    let random = merged.sort(() => 0.5 - Math.random()).slice(0, 9);
    res.json(random);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    console.log(err);
  }
};

exports.handleWhitelist = async (req, res) => {
  const _id = req.body.l._id;
  const whitelist = req.body.l.whitelist;

  if (whitelist === 'false') {
    const location = await Location.updateOne(
      {
        _id,
      },
      { $set: { whitelist: 'true' } }
    );
    res.json({ ok: true });
  } else {
    const location = await Location.updateOne(
      {
        _id,
      },
      { $set: { whitelist: 'false' } }
    );
    res.json({ ok: true });
  }
};

exports.searchLocations = async (req, res) => {
  const { query } = req.body;

  if (!query) {
    const location = await Location.find({});
    res.json(location);
  } else {
    const location = await Location.find({
      $or: [
        { country: { $regex: query, $options: 'i' } },
        { countryCode: { $regex: query, $options: 'i' } },
        { whitelist: { $regex: query, $options: 'i' } },
      ],
    });
    res.json(location);
  }
};

exports.allowUSA = async (req, res) => {
  try {
    const permitUSA = await Location.findOneAndUpdate(
      { countryCode: 'US' },
      { $set: { whitelist: 'true' } },
      { new: true }
    );
    res.json(permitUSA);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchWhitelist = async (req, res) => {
  try {
    const whitelist = await Location.find({ whitelist: 'true' }).select(
      'countryCode'
    );
    res.json(whitelist);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchCodes = async (req, res) => {
  try {
    const codes = await CallingCode.find().sort({ country: 1 });
    res.json(codes);
  } catch (err) {
    console.log(err);
  }
};

exports.handlePermitted = async (req, res) => {
  const _id = req.body.c._id;
  const permitted = req.body.c.permitted;
  if (permitted === 'false') {
    const code = await CallingCode.updateOne(
      {
        _id,
      },
      { $set: { permitted: 'true' } }
    );
    res.json({ ok: true });
  } else {
    const code = await CallingCode.updateOne(
      {
        _id,
      },
      { $set: { permitted: 'false' } }
    );
    res.json({ ok: true });
  }
};

exports.searchCodes = async (req, res) => {
  const { query } = req.body;
  if (!query) {
    const code = await CallingCode.find({});
    res.json(code);
  } else {
    const code = await CallingCode.find({
      $or: [
        { country: { $regex: query, $options: 'i' } },
        { callingCode: { $regex: query, $options: 'i' } },
        { permitted: { $regex: query, $options: 'i' } },
      ],
    });
    res.json(code);
  }
};

exports.addUserToAdmin = async (req, res) => {
  try {
    const makeAdmin = await User.findByIdAndUpdate(
      req.body.u._id,
      { role: 'secondary-admin' },
      { new: true }
    ).select('role');
    res.json(makeAdmin);
  } catch (err) {
    console.log(err);
  }
};

exports.removeUserFromAdmin = async (req, res) => {
  try {
    const makeSubscriber = await User.findByIdAndUpdate(
      req.body.u._id,
      { role: 'subscriber' },
      { new: true }
    ).select('role');
    res.json(makeSubscriber);
  } catch (err) {
    console.log(err);
  }
};

exports.addUserToFeaturedMembers = async (req, res) => {
  try {
    const makeFeaturedMember = await User.findByIdAndUpdate(
      req.body.u._id,
      { featuredMember: true },
      { new: true }
    ).select('featuredMember');
    res.json(makeFeaturedMember);
  } catch (err) {
    console.log(err);
  }
};

exports.removeUserFromFeaturedMembers = async (req, res) => {
  try {
    const unMakeFeaturedMember = await User.findByIdAndUpdate(
      req.body.u._id,
      { featuredMember: false },
      { new: true }
    ).select('featuredMember');
    res.json(unMakeFeaturedMember);
  } catch (err) {
    console.log(err);
  }
};

exports.addUserToEventsEligible = async (req, res) => {
  try {
    const makeEventsEligible = await User.findByIdAndUpdate(
      req.body.u._id,
      { eventsEligible: true },
      { new: true }
    ).select('eventsEligible');
    res.json(makeEventsEligible);
  } catch (err) {
    console.log(err);
  }
};

exports.removeUserFromEventsEligible = async (req, res) => {
  try {
    const unMakeEventsEligible = await User.findByIdAndUpdate(
      req.body.u._id,
      { eventsEligible: false },
      { new: true }
    ).select('eventsEligible');
    res.json(unMakeEventsEligible);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchFeaturedMembers = async (req, res) => {
  const featuredMembers = await User.find({ featuredMember: true }).select(
    '_id name email username profileImage featuredMember'
  );
  res.json(featuredMembers);
};

exports.removeExpiredFeatures = async (req, res) => {
  const ids = [];
  const expiredFeatures = await User.find({
    $and: [
      { 'pointsSpent.reason': 'featured' },
      {
        'pointsSpent.spent': {
          $lt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
        },
      },
    ],
  });
  expiredFeatures.map((u) => {
    ids.push(u._id);
  });

  const removeExpired = await User.updateMany(
    {
      _id: { $in: ids },
      'pointsSpent.reason': 'featured',
    },
    {
      $set: { 'pointsSpent.$.reason': 'expired' },
      featuredMember: false,
    },
    { new: true }
  ).exec();

  res.json({ ok: true });
};

exports.dailyMatches = async (req, res) => {
  const firstMember = await User.findById('63dc1d2a8eb01e4110743044').select(
    '_id createdAt'
  );
  const inception = firstMember.createdAt;
  const today = Date.now();
  const differenceTime = today - inception.getTime();
  const differenceDays = Math.floor(differenceTime / (1000 * 3600 * 24));
  const matches = await User.aggregate([
    { $unwind: '$matches' },
    {
      $group: {
        _id: '',
        count: { $sum: 1 },
      },
    },
  ]);
  const numMatches = matches[0].count / 2;
  const numDailyMatches = Math.ceil(numMatches / differenceDays);

  res.json(numDailyMatches);
};

exports.dailySignups = async (req, res) => {
  const firstMember = await User.findById('63dc1d2a8eb01e4110743044').select(
    '_id createdAt'
  );
  const inception = firstMember.createdAt;
  const today = Date.now();
  const differenceTime = today - inception.getTime();
  const differenceDays = Math.floor(differenceTime / (1000 * 3600 * 24));
  const signups = await User.find().estimatedDocumentCount();
  const numDailySignups = Math.ceil(signups / differenceDays);

  res.json(numDailySignups);
};
