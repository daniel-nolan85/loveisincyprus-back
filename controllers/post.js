const Post = require('../models/post');
const User = require('../models/user');
const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

exports.createPost = async (req, res) => {
  const { content, postImages, user } = req.body;

  try {
    if (!content.length) {
      res.json({
        error: 'Content is required',
      });
    } else {
      const post = new Post({ content, postImages, postedBy: user });
      post.save();
      if (postImages) {
        const user1 = await User.findByIdAndUpdate(
          req.body.user._id,
          {
            $push: {
              uploadedPhotos: { $each: postImages, $position: 0 },
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
  const currentPage = req.params.page || 1;
  const perPage = 10;

  try {
    const posts = await Post.find({ postedBy: user })
      .populate('postedBy', '_id name profileImage email username')
      .populate('comments.postedBy', '_id name email profileImage username')
      .populate('likes', '_id name email profileImage username')
      .sort({ createdAt: -1 })
      .limit(currentPage * perPage);
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.userPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate(
      'comments.postedBy',
      '_id name email profileImage username'
    );
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.updatePost = async (req, res) => {
  try {
    const update = {};
    let images = req.body.post.postImages;

    if (req.body.content) {
      update.content = req.body.content;
    }
    if (req.body.postImages.length > 0) {
      req.body.postImages.map((img) => images.unshift(img));
      update.postImages = images;
      const user1 = await User.findByIdAndUpdate(
        req.body._id,
        {
          $push: {
            uploadedPhotos: { $each: req.body.postImages, $position: 0 },
          },
        },
        {
          new: true,
        }
      );
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
    const post = await Post.findById(req.params.postId).select(
      'postImages comments'
    );
    const urls = post.postImages.map((img) => img.url);
    const public_ids = post.postImages.map((img) => img.public_id);

    for (const public_id of public_ids) {
      const image = await cloudinary.uploader.destroy(public_id);
    }
    if (post.postImages && post.postImages.length > 0) {
      const user = await User.findByIdAndUpdate(
        req.body.post.postedBy,
        {
          $pull: {
            uploadedPhotos: { url: { $in: urls } },
          },
        },
        {
          new: true,
        }
      ).select('uploadedPhotos');
    }
    if (post.comments && post.comments.length > 0) {
      const comment_ids = post.comments
        .map((comment) => {
          if (comment.image) {
            return comment.image.public_id;
          }
        })
        .filter((id) => id != null);
      for (const comment_id of comment_ids) {
        const image = await cloudinary.uploader.destroy(comment_id);
      }
    }
    const postToDelete = await Post.findByIdAndDelete(req.params.postId);
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

exports.reportPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { reported: true },
      { new: true }
    );

    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.newsFeed = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id);
    let following = user.following;
    let matches = user.matches;
    following.push(req.body.user._id);

    const currentPage = req.params.page || 1;
    const perPage = 10;

    const posts = await Post.find({
      $or: [{ postedBy: { $in: following } }, { postedBy: { $in: matches } }],
    })
      .populate('postedBy', '_id name email profileImage username')
      .populate('comments.postedBy', '_id name email profileImage username')
      .populate('likes', '_id name email profileImage username')
      .sort({
        createdAt: -1,
      })
      .limit(currentPage * perPage);
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.likePost = async (req, res) => {
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

      const sendNotif = await User.findByIdAndUpdate(
        post.postedBy,
        {
          $addToSet: {
            newNotifs: { action: 'Someone liked your post', id: post._id },
          },
        },
        { new: true }
      );
    }
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.unlikePost = async (req, res) => {
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
  try {
    const { postId, comment, image, user } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: { text: comment, image, postedBy: user._id } },
      },
      { new: true }
    )
      .populate('postedBy', '_id name email profileImage username mobile')
      .populate(
        'comments.postedBy',
        '_id name email profileImage username mobile'
      );

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
      const sendNotif = await User.findByIdAndUpdate(
        post.postedBy,
        {
          $addToSet: {
            newNotifs: {
              action: 'Someone commented on your post',
              id: post._id,
            },
          },
        },
        { new: true }
      );
    }
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.removeComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { comments: { _id: comment._id } },
      },
      { new: true }
    );
    if (comment.image) {
      const image = await cloudinary.uploader.destroy(comment.image.public_id);
    }
    res.json(post);
  } catch (err) {
    console.log(err);
  }
};

exports.updateComment = async (req, res) => {
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

exports.reportComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    const post = await Post.findOneAndUpdate(
      {
        _id: postId,
        'comments._id': comment._id,
      },
      {
        $set: { 'comments.$.reported': true },
      },
      { new: true }
    );
    res.json(post);
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
  const { userId } = req.body;

  const currentPage = req.params.page || 1;
  const perPage = 10;

  try {
    const thisUser = await User.findById(userId);
    const posts = await Post.find({ postedBy: thisUser })
      .populate('postedBy', '_id name profileImage email username')
      .populate('comments.postedBy', '_id name email profileImage username')
      .populate('likes', '_id name email profileImage username')
      .sort({ createdAt: -1 })
      .limit(currentPage * perPage);
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
  try {
    const { user } = req.body;
    const following = user.following;
    const matches = user.matches;
    following.push(user._id);
    const posts = await Post.find({
      $or: [{ postedBy: { $in: following } }, { postedBy: { $in: matches } }],
    });
    const total = posts.length;
    res.json(total);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchReportedPosts = async (req, res) => {
  try {
    const posts = await Post.find({ reported: true })
      .populate('postedBy', '_id name email profileImage username mobile')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.fetchReportedComments = async (req, res) => {
  try {
    const posts = await Post.find({ 'comments.reported': true })
      .populate(
        'comments.postedBy',
        '_id name email profileImage username mobile'
      )
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.deletePostPic = async (req, res) => {
  const { _id, img, post } = req.body;
  try {
    const postToUpdate = await Post.findOneAndUpdate(
      { _id: post._id },
      { $pull: { postImages: { url: img.url } } },
      { new: true }
    );
    const user = await User.findOneAndUpdate(
      { _id },
      {
        $pull: { uploadedPhotos: { url: img.url } },
      },
      { new: true }
    ).select('uploadedPhotos');
    const image = await cloudinary.uploader.destroy(img.public_id);
    res.json(postToUpdate);
  } catch (err) {
    console.log(err);
    res.json(err);
  }
};
