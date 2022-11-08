const Post = require('../models/post');
const User = require('../models/user');
const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

exports.createPost = async (req, res) => {
  // console.log('createPost controller response => ', req.body);
  const { content, image, user } = req.body;

  try {
    if (!content.length) {
      res.json({
        error: 'Content is required',
      });
    } else {
      const post = new Post({ content, image, postedBy: user });
      post.save();
      if (image.url) {
        const user1 = await User.findByIdAndUpdate(
          req.body.user._id,
          {
            $push: {
              uploadedPhotos: image.url,
            },
          },
          {
            new: true,
          }
        );
      }
      res.json(post);
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};

exports.uploadImage = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.files.image.path);
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.postsByUser = async (req, res) => {
  const { user } = req.body;
  // console.log(user);

  const currentPage = req.params.page || 1;
  const perPage = 10;

  try {
    const posts = await Post.find({ postedBy: user })
      // .skip((currentPage - 1) * perPage)
      .populate('postedBy', '_id name profileImage email username')
      .populate('comments.postedBy', '_id name email profileImage username')
      .populate('likes', '_id name email profileImage username')
      .sort({ createdAt: -1 })
      .limit(currentPage * perPage);
    // const posts = await Post.find()
    //   .populate('postedBy', '_id name image email')
    //   .sort({ createdAt: -1 })
    //   .limit(10);
    // console.log(posts);
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.userPost = async (req, res) => {
  try {
    // const post = await Post.findById(req.params._id);
    const post = await Post.findById(req.params.postId).populate(
      'comments.postedBy',
      '_id name email profileImage username'
    );
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

// exports.updatePost = async (req, res) => {
//   try {
//     const post = await Post.findByIdAndUpdate(req.params.postId, req.body, {
//       new: true,
//     });
//     res.json(post);
//   } catch (err) {
//     console.log(err);
//   }
// };

exports.updatePost = async (req, res) => {
  console.log('updatePost controller response => ', req.body);
  try {
    const update = {};

    if (req.body.content) {
      update.content = req.body.content;
    }
    if (Object.keys(req.body.image).length !== 0) {
      update.image = req.body.image;
    }
    const post = await Post.findByIdAndUpdate(req.body.post._id, update, {
      new: true,
    });
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    // remove the image from cloudinary
    if (post.image) {
      const image = await cloudinary.uploader.destroy(post.image);
      const user = await User.findByIdAndUpdate(
        req.body.post.postedBy._id,
        {
          $pull: {
            uploadedPhotos: post.image.url,
          },
        },
        {
          new: true,
        }
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

exports.newsFeed = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id);
    let following = user.following;
    following.push(req.body.user._id);

    const currentPage = req.params.page || 1;
    const perPage = 10;

    const posts = await Post.find({ postedBy: { $in: following } })
      // .skip((currentPage - 1) * perPage)
      .populate('postedBy', '_id name email profileImage username')
      .populate('comments.postedBy', '_id name email profileImage username')
      .populate('likes', '_id name email profileImage username')
      .sort({
        createdAt: -1,
      })
      .limit(currentPage * perPage);
    res.json(posts);
    // console.log(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.likePost = async (req, res) => {
  console.log('like post controller response => ', req.body);
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      {
        $addToSet: { likes: req.body.user._id },
      },
      { new: true }
    )
      .populate('likes', '_id name email profileImage username')
      .populate('comments.postedBy', '_id name email profileImage username');

    if (post.postedBy != req.body.user._id) {
      const notify = await User.findByIdAndUpdate(
        post.postedBy,
        {
          $push: {
            notifications: {
              notif: post._id,
              action: 'liked post',
            },
          },
        },
        { new: true }
      )
        .populate('notif')
        .populate('notif.likes', '_id name email profileImage username')
        .populate(
          'notif.comments.postedBy',
          '_id name email profileImage username'
        );
    }
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.unlikePost = async (req, res) => {
  // console.log('unlike post controller response => ', req.body);
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      {
        $pull: { likes: req.body.user._id },
      },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.addComment = async (req, res) => {
  // console.log('add comment controller response => ', req.body);
  try {
    const { postId, comment, image, user } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: { text: comment, image, postedBy: user._id } },
      },
      { new: true }
    )
      .populate('postedBy', '_id name email profileImage username')
      .populate('comments.postedBy', '_id name email profileImage username');

    if (post.postedBy._id != user._id) {
      const notify = await User.findByIdAndUpdate(
        post.postedBy,
        {
          $push: {
            notifications: {
              notif: post._id,
              action: 'commented post',
            },
          },
        },
        { new: true }
      ).populate('notif');
    }
    res.json(post);
    console.log('post ==> ', post);
    console.log('user ==> ', user);
  } catch (err) {
    console.log(err);
  }
};

exports.removeComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    console.log('removeComment controller response', postId, comment);

    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { comments: { _id: comment._id } },
      },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.updateComment = async (req, res) => {
  // console.log('updateComment controller response => ', req.body);

  let text;
  if (req.body.text) {
    text = req.body.text;
  } else {
    text = req.body.comment.text;
  }

  let image;
  if (Object.keys(req.body.image).length !== 0) {
    image = req.body.image;
  } else if (req.body.comment.image) {
    image = req.body.comment.image;
  } else {
    image = '';
  }

  console.log('image => ', image);

  const query = { _id: req.body.postId, 'comments._id': req.body.comment._id };
  const updateComment = !image
    ? {
        $set: {
          'comments.$.text': text,
        },
      }
    : {
        $set: {
          'comments.$.text': text,
          'comments.$.image': image,
        },
      };

  try {
    const comment = await Post.updateOne(query, updateComment);
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

exports.totalPosts = async (req, res) => {
  try {
    const total = await Post.find().estimatedDocumentCount();
    res.json(total);
  } catch (err) {
    console.log(err);
  }
};

exports.thisUsersPosts = async (req, res) => {
  // console.log('this users posts controller response => ', req.body);
  const { userId } = req.body;

  const currentPage = req.params.page || 1;
  const perPage = 10;

  try {
    const thisUser = await User.findById(userId);
    // console.log('this users posts controller response => ', thisUser);
    const posts = await Post.find({ postedBy: thisUser })
      // .skip((currentPage - 1) * perPage)
      .populate('postedBy', '_id name profileImage email username')
      .populate('comments.postedBy', '_id name email profileImage username')
      .populate('likes', '_id name email profileImage username')
      .sort({ createdAt: -1 })
      .limit(currentPage * perPage);
    // console.log(posts);
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.totalPostsByUser = async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: req.body.user._id });
    const total = posts.length;
    res.json(total);
  } catch (err) {
    console.log(err);
  }
};

exports.totalPostsByThisUser = async (req, res) => {
  // console.log('totalPostsByUser controller response => ', req.body);
  try {
    const { userId } = req.body;
    const thisUser = await User.findById(userId);
    const posts = await Post.find({ postedBy: thisUser });
    const total = posts.length;
    res.json(total);
  } catch (err) {
    console.log(err);
  }
};

exports.posts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('postedBy', '_id name email profileImage username')
      .populate('comments.postedBy', '_id name email profileImage username')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.adminRemoveComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    // console.log('adminRemoveComment controller response', postId, commentId);
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { comments: { _id: comment._id } },
      },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.followersPosts = async (req, res) => {
  // console.log('followersPosts controller response => ', req.body);
  try {
    const { user } = req.body;
    const following = user.following;
    following.push(user._id);
    const posts = await Post.find({ postedBy: { $in: following } });
    const total = posts.length;
    res.json(total);
  } catch (err) {
    console.log(err);
  }
};
