const User = require('../models/user');
const Post = require('../models/post');
const Location = require('../models/location');
const { nanoid } = require('nanoid');
const { json } = require('express');
const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

exports.createOrUpdateUser = async (req, res) => {
  // const { name, picture, email } = req.user;
  const { name, photo, email, username, followers, following } = req.user;
  const user = await User.findOneAndUpdate(
    { email },
    // { name: email.split('@')[0], picture },
    // { name, photo },
    { new: true }
  );

  if (user) {
    // console.log('USER UPDATED', user);
    res.json(user);
  } else {
    const newUser = await new User({
      email,
      // name,
      // picture,
      // photo,
      username: nanoid(6),
      followers,
      following,
    }).save();
    // console.log('USER CREATED', newUser);
    res.json(newUser);
  }
};

exports.currentUser = async (req, res) => {
  User.findOne({ email: req.user.email }).exec((err, user) => {
    if (err) throw new Error(err);
    res.json(user);
  });
};

exports.profileUpdate = async (req, res) => {
  console.log('profileUpdate controller response', req.body);
  try {
    const data = {};

    if (req.body.username) {
      data.username = req.body.username;
    }
    if (req.body.about) {
      data.about = req.body.about;
    }
    if (req.body.name) {
      data.name = req.body.name;
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

    let user = await User.findByIdAndUpdate(req.body.user._id, data, {
      new: true,
    });

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
    console.log('profileUpdate => ', err);
  }
};

// exports.cropProfile = async (req, res) => {
//   try {
//     console.log('cropProfile controller response => ', req.body);
//     let user = await User.findByIdAndUpdate(
//       req.body.user._id,
//       { profileImage: req.body.profileImage },
//       {
//         new: true,
//       }
//     );
//     res.json(user);
//   } catch (err) {
//     console.log(err);
//   }
// };

exports.findUsers = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id);
    let following = user.following;
    following.push(user._id);
    // const users = await User.find({ _id: { $nin: following } }).limit(1);
    const users = await User.aggregate([
      { $match: { _id: { $nin: following } } },
      { $sample: { size: 5 } },
    ]);
    res.json(users);
  } catch (err) {
    console.log('findUsers => ', err);
  }
};

// exports.userFollow = async (req, res) => {
//   console.log('user follow controller response => ', req.body);

//   try {
//     const user = await User.findByIdAndUpdate(
//       req.body.user._id,
//       {
//         $addToSet: {
//           following: req.body.u._id,
//         },
//       },
//       { new: true }
//     );
//     res.json(user);
//   } catch (err) {
//     console.log(err);
//   }
// };

exports.userFollow = async (req, res) => {
  try {
    const check = await User.findById(req.body.u._id);

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
        .populate('following', '_id name email profileImage')
        .populate('followers', '_id name email profileImage');
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
        .populate('following', '_id name email profileImage')
        .populate('followers', '_id name email profileImage');
      res.json(user);
    }
  } catch (err) {
    console.log('userFollow => ', err);
  }
};

// exports.userUnfollow = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(
//       req.body.user._id,
//       {
//         $pull: { following: req.body.u._id },
//       },
//       { new: true }
//     );
//     res.json(user);
//   } catch (err) {
//     console.log(err);
//   }
// };

exports.userUnfollow = async (req, res) => {
  try {
    const check = await User.findById(req.body.u._id);

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
      );
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
      );
      res.json(user);
    }
  } catch (err) {
    console.log('userUnfollow => ', err);
  }
};

exports.userFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id);
    const following = await User.find({ _id: user.following });
    res.json(following);
  } catch (err) {
    console.log('userFollowing => ', err);
  }
};

exports.userFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id);
    const followers = await User.find({ _id: user.followers });
    res.json(followers);
  } catch (err) {
    console.log('userFollowers => ', err);
  }
};

exports.userMatches = async (req, res) => {
  // console.log('userMatches controller response => ', req.body);
  try {
    const user = await User.findById(req.body.user._id);
    const matches = await User.find({ _id: user.matches });
    // if (req.body.chats && req.body.chats.length > 0) {
    //   const { chats } = req.body;
    //   matches.sort(
    //     (a, b) => b.chats.updatedAt - a.chats.updatedAt
    //   );
    // }
    res.json(matches);
  } catch (err) {
    console.log('userMatches => ', err);
  }
};

exports.userVisitors = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id);
    const visitors = await User.find({ _id: user.visitors });
    res.json(visitors);
  } catch (err) {
    console.log('userVisitors => ', err);
  }
};

exports.nineMatches = async (req, res) => {
  // console.log('nineMatches controller response', req.body);
  try {
    const user = await User.findById(req.body.user._id);
    let matches = user.matches;
    // const matches = await User.find({ _id: user.matches });
    const users = await User.aggregate([
      { $match: { _id: { $in: matches } } },
      { $sample: { size: 9 } },
    ]);
    // console.log('ninematches controller response', users);
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
    }).select('_id name email username profileImage');
    res.json(user);
  } catch (err) {
    console.log('searchUser => ', err);
  }
};

exports.userProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const thisUser = await User.findById(userId);
    res.json(thisUser);
  } catch (err) {
    console.log('userProfile => ', err);
  }
};

exports.cropCover = async (req, res) => {
  // console.log('cropCover controller response => ', req.body);
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
      );
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
  // console.log('cropProfile controller response => ', req.body);
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
      );
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
  try {
    const users = await User.find();
    // console.log(users);
    res.json(users);
  } catch (err) {
    console.log('users => ', err);
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
    res.json({ ok: true });
  } catch (err) {
    console.log('deleteUser => ', err);
  }
};

exports.recentUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(6);
    // console.log(users);
    res.json(users);
  } catch (err) {
    console.log('recentUsers => ', err);
  }
};

exports.searchPosts = async (req, res) => {
  const { query } = req.params;

  if (!query) return;
  try {
    const post = await Post.find({
      $or: [{ content: { $regex: query, $options: 'i' } }],
    }).populate('postedBy', '_id name email profileImage');
    res.json(post);
  } catch (err) {
    console.log('searchPosts => ', err);
  }
};

// exports.searchAdmin = async (req, res) => {
//   const { query } = req.params;

//   if (!query) return;
//   try {
//     const user = await User.find({
//       $or: [
//         { email: { $regex: query, $options: 'i' } },
//         { name: { $regex: query, $options: 'i' } },
//         { username: { $regex: query, $options: 'i' } },
//       ],
//     }).select('_id name email username profileImage');
//     const post = await Post.find({
//       $or: [{ content: { $regex: query, $options: 'i' } }],
//     });
//     res.json({ user, post });
//   } catch (err) {
//     console.log(err);
//   }
// };

exports.usersToSwipe = async (req, res) => {
  try {
    // let usersUnavailable = [];
    const user = await User.findById(req.body.user._id);
    let usersUnavailable = user.following;
    usersUnavailable.push(user._id);
    if (user.nopes.length > 0) {
      user.nopes.map((nope) => usersUnavailable.push(nope._id));
    }
    const total = await User.find();
    let usersAvailable = total.length - usersUnavailable.length;
    const users = await User.find({ _id: { $nin: usersUnavailable } }).limit(
      usersAvailable
    );
    // const users = await User.aggregate([
    //   { $match: { _id: { $nin: usersUnavailable } } },
    //   { $sample: { size: usersAvailable } },
    // ]);
    res.json(users);
  } catch (err) {
    console.log('usersToSwipe => ', err);
  }
};

exports.leftSwipe = async (req, res) => {
  // console.log('leftSwipe controller response => ', req.body);

  const user = await User.findByIdAndUpdate(req.body.user._id, {
    $addToSet: {
      nopes: req.body.u._id,
    },
  });
  res.json(user);
};

exports.fetchVisitor = async (req, res) => {
  // console.log('fetchVisitor controller response => ', req.body);
  const user = await User.findByIdAndUpdate(req.body.userId, {
    $addToSet: {
      visitors: req.body.user._id,
    },
  });
  res.json(user);
};

exports.nineVisitors = async (req, res) => {
  // console.log('nineVisitors controller response', req.body);
  try {
    const user = await User.findById(req.body.user._id);
    let visitors = user.visitors;
    // const followers = await User.find({ _id: user.followers });
    const users = await User.aggregate([
      { $match: { _id: { $in: visitors } } },
      { $sample: { size: 9 } },
    ]);
    // console.log('ninefollowers controller response', users);
    res.json(users);
  } catch (err) {
    console.log('nineVisitors => ', err);
  }
};

exports.ninePhotos = async (req, res) => {
  // console.log('ninePhotos controller response', req.body);
  try {
    const user = await User.findById(req.body.user._id);
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
  // console.log('usersNinePhotos controller response', req.body);
  try {
    const user = await User.findById(req.body.userId);
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
  console.log('handleWhitelist controller response => ', req.body);
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

// exports.handleWhitelist = async (req, res) => {
//   console.log('handleWhitelist controller response => ', req.body);
//   const country = req.body.data[0];
//   const countryCode = req.body.data[1];
//   const whitelist = req.body.data[2];

//   const location = await Location.findOne({ country });
//   if (location) {
//     const blacklist = await Location.deleteOne({ country: location.country });
//     res.json(location);
//   } else {
//     const newLocation = await new Location({
//       country,
//       countryCode,
//       whitelist,
//     }).save();
//     res.json(newLocation);
//   }
// };

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

exports.fetchWhitelist = async (req, res) => {
  try {
    const whitelist = await Location.find({ whitelist: true }).select(
      'countryCode'
    );
    res.json(whitelist);
  } catch (err) {
    console.log(err);
  }
};

exports.addUserToAdmin = async (req, res) => {
  // console.log('addUserToAdmin controller response => ', req.body);
  try {
    const makeAdmin = await User.findByIdAndUpdate(
      req.body.u._id,
      { role: 'admin' },
      { new: true }
    );
    res.json(makeAdmin);
  } catch (err) {
    console.log(err);
  }
};

exports.removeUserFromAdmin = async (req, res) => {
  // console.log('removeUserFromAdmin controller response => ', req.body);
  try {
    const makeSubscriber = await User.findByIdAndUpdate(
      req.body.u._id,
      { role: 'subscriber' },
      { new: true }
    );
    res.json(makeSubscriber);
  } catch (err) {
    console.log(err);
  }
};

exports.addUserToFeaturedMembers = async (req, res) => {
  // console.log('addUserToFeaturedMembers controller response => ', req.body);
  try {
    const makeFeaturedMember = await User.findByIdAndUpdate(
      req.body.u._id,
      { featuredMember: true },
      { new: true }
    );
    res.json(makeFeaturedMember);
  } catch (err) {
    console.log(err);
  }
};

exports.removeUserFromFeaturedMembers = async (req, res) => {
  // console.log('removeUserFromFeaturedMembers controller response => ', req.body);
  try {
    const unMakeFeaturedMember = await User.findByIdAndUpdate(
      req.body.u._id,
      { featuredMember: false },
      { new: true }
    );
    res.json(unMakeFeaturedMember);
  } catch (err) {
    console.log(err);
  }
};
