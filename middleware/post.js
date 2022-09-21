const Post = require('../models/post');

exports.canEditDeletePost = async (req, res, next) => {
  const { user } = req.body;

  try {
    const post = await Post.findById(req.params.postId);

    if (user._id != post.postedBy) {
      return res.status(400).send('Unauthorized');
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.canEditDeleteEventPost = async (req, res, next) => {
  console.log('canEditDeleteEventPost middleware response => ', req.body);
  const { user, post } = req.body;

  try {
    if (user._id != post.postedBy._id) {
      return res.status(400).send('Unauthorized');
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.canDeleteComment = async (req, res, next) => {
  // console.log('canDeleteComment middleware response = > ', req.body);
  try {
    const { user } = req.body;
    const post = await Post.findById(req.body.postId);
    // console.log('post => ', post.postedBy);
    if (
      user._id != post.postedBy &&
      user._id != req.body.comment.postedBy._id
    ) {
      return res.status(400).send('Unauthorized');
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.canEditComment = async (req, res, next) => {
  // console.log('canEditComment middleware response = > ', req.body);
  try {
    if (req.body.user._id != req.body.comment.postedBy._id) {
      return res.status(400).send('Unauthorized');
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.canDeleteEventComment = async (req, res, next) => {
  console.log('canDeleteEventComment middleware response = > ', req.body);
  try {
    const { user, postId } = req.body;
    if (user._id != req.body.comment.postedBy._id) {
      return res.status(400).send('Unauthorized');
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
  }
};
