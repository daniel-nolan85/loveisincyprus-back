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
  console.log('canEditDeleteEventPost middleware response => ', req.body);
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
  console.log('canDeleteComment middleware response = > ', req.body);
  try {
    const { _id } = req.body;
    const post = await Post.findById(req.body.postId);
    // console.log('post => ', post.postedBy);
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
  console.log('canEditComment middleware response = > ', req.body);
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
  console.log('canDeleteEventComment middleware response = > ', req.body);
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
