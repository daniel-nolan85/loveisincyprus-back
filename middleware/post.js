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
