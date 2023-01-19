const Post = require('../models/post');

exports.canEditDeletePost = async (req, res, next) => {
  const { _id } = req.body;

  try {
    const post = await Post.findById(req.params.postId);

    if (_id != post.postedBy) {
      return res.status(400).send('Unauthorized');
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.canEditDeleteEventPost = async (req, res, next) => {
  const { _id, post } = req.body;

  try {
    if (_id != post.postedBy._id) {
      return res.status(400).send('Unauthorized');
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.canDeleteComment = async (req, res, next) => {
  try {
    const { _id } = req.body;
    const post = await Post.findById(req.body.postId);
    if (_id != post.postedBy && _id != req.body.comment.postedBy._id) {
      return res.status(400).send('Unauthorized');
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.canEditComment = async (req, res, next) => {
  try {
    if (req.body._id != req.body.comment.postedBy._id) {
      return res.status(400).send('Unauthorized');
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.canDeleteEventComment = async (req, res, next) => {
  try {
    const { _id, postId } = req.body;
    if (_id != req.body.comment.postedBy._id) {
      return res.status(400).send('Unauthorized');
    } else {
      next();
    }
  } catch (err) {
    console.log(err);
  }
};
