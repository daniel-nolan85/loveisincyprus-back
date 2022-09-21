const Event = require('../models/event');
const User = require('../models/user');
const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

exports.create = async (req, res) => {
  // console.log('create event controller response => ', req.body);
  try {
    const newEvent = await new Event(req.body).save();

    const notify = await User.updateMany(
      { _id: { $in: req.body.invitees } },
      {
        $push: {
          notifications: {
            notif: newEvent,
            action: 'new event',
          },
        },
      },
      { new: true }
    ).populate('notif');

    res.json(newEvent);
  } catch (err) {
    console.log(err);
    res.status(400).json({
      err: err.message,
    });
  }
};

exports.list = async (req, res) => {
  res.json(await Event.find({}).sort({ name: 1 }).exec());
};

exports.read = async (req, res) => {
  let event = await Event.findOne({ _id: req.params.eventId }).exec();
  res.json(event);
};

exports.update = async (req, res) => {
  console.log('update event controller response => ', req.body);
  const { name, location, when, notes, invitees } = req.body;
  try {
    const updated = await Event.findOneAndUpdate(
      { _id: req.body._id },
      req.body,
      { new: true }
    ).exec();
    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send('Update event failed');
  }
};

exports.cancel = async (req, res) => {
  console.log('event cancel controller response => ', req.params);
  try {
    res.json(
      await Event.findOneAndUpdate(
        { _id: req.params.eventId },
        { cancelled: true },
        { new: true }
      )
    );
  } catch (err) {
    console.log(err);
    res.status(400).send('Cancel event failed');
  }
};

exports.fetchUserEvents = async (req, res) => {
  console.log('fetchUserEvents controller response => ', req.body);
  res.json(
    await Event.find({
      invitees: { $elemMatch: { _id: req.body.user._id } },
    }).exec()
  );
};

exports.fetchPrevEvents = async (req, res) => {
  console.log('fetchPrevEvents controller response => ', req.body);
  res.json(
    await Event.find({
      invitees: { $elemMatch: { _id: req.body.user._id } },
      when: { $lt: new Date() },
    }).exec()
  );
};

exports.fetchComingEvents = async (req, res) => {
  console.log('fetchComingEvents controller response => ', req.body);
  res.json(
    await Event.find({
      invitees: { $elemMatch: { _id: req.body.user._id } },
      when: { $gt: new Date() },
    }).exec()
  );
};

exports.fetchEvent = async (req, res) => {
  console.log('fetchEvent controller response => ', req.body);
  res.json(
    await Event.findById(req.body.params.eventId)
      .populate('post.postedBy', '_id name email profileImage')
      .populate('post.likes', '_id name email profileImage')
      .populate('post.comments.postedBy', '_id name email profileImage')
      .exec()
  );
};

exports.createEventPost = async (req, res) => {
  console.log('createEventPost controller response => ', req.body);
  const { content, image, user, event } = req.body;

  try {
    if (!content.length) {
      res.json({
        error: 'Content is required',
      });
    } else {
      const post = await Event.findByIdAndUpdate(
        { _id: event._id },
        { $push: { post: { content, image, postedBy: user } } },
        { new: true }
      );
      if (image.url) {
        const eventImg = await Event.findByIdAndUpdate(
          { _id: event._id },
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

exports.likeEventPost = async (req, res) => {
  // console.log('likeEventPost controller response => ', req.body);
  try {
    const eventPost = await Event.findOneAndUpdate(
      { 'post._id': req.body._id },
      {
        $addToSet: { 'post.$.likes': req.body.user._id },
      },
      { new: true }
    );

    if (eventPost.postedBy != req.body.user._id) {
      const notify = await User.findByIdAndUpdate(
        eventPost.postedBy,
        {
          $push: {
            notifications: {
              notif: eventPost._id,
              action: 'liked post',
            },
          },
        },
        { new: true }
      )
        .populate('notif')
        .populate('notif.likes', '_id name email profileImage')
        .populate('notif.comments.postedBy', '_id name email profileImage');
    }
    res.json(eventPost);
  } catch (err) {
    console.log(err);
  }
};

exports.unlikeEventPost = async (req, res) => {
  // console.log('unlike post controller response => ', req.body);
  try {
    const eventPost = await Event.findOneAndUpdate(
      { 'post._id': req.body._id },
      {
        $pull: { 'post.$.likes': req.body.user._id },
      },
      { new: true }
    );
    res.json(eventPost);
  } catch (err) {
    console.log(err);
  }
};

exports.updateEventPost = async (req, res) => {
  console.log('updateEventPost controller response => ', req.body);

  let content;
  if (req.body.content) {
    content = req.body.content;
  } else {
    content = req.body.post.content;
  }

  let image;
  if (Object.keys(req.body.image).length !== 0) {
    image = req.body.image;
  } else if (req.body.post.image) {
    image = req.body.post.image;
  } else {
    image = '';
  }

  const query = {
    'post._id': req.body.post._id,
  };

  const updatePost = !image
    ? {
        $set: {
          'post.$[post].content': content,
        },
      }
    : {
        $set: {
          'post.$[post].content': content,
          'post.$[post].image': image,
        },
      };

  try {
    const post = await Event.findOneAndUpdate(query, updatePost, {
      arrayFilters: [{ 'post._id': { $eq: req.body.post._id } }],
    });
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

exports.deleteEventPost = async (req, res) => {
  console.log('deleteEventPost controller response => ', req.body);
  try {
    if (req.body.post.image) {
      const image = await cloudinary.uploader.destroy(req.body.post.image);
      const eventImage = await Event.findOneAndUpdate(
        { 'post._id': req.body.post._id },
        {
          $pull: {
            uploadedPhotos: req.body.post.image.url,
          },
        },
        {
          new: true,
        }
      );
    }
    const post = await Event.findOneAndUpdate(
      {
        'post._id': req.body.post._id,
      },
      {
        $pull: {
          post: { _id: req.body.post._id },
        },
      },
      { new: true }
    );
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

exports.removeEventComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    console.log('removeComment controller response', postId, comment);

    const eventPost = await Event.findOneAndUpdate(
      { 'post._id': postId },
      {
        $pull: {
          'post.$.comments': { _id: comment._id },
        },
      },
      { new: true }
    );
    res.json(eventPost);
  } catch (err) {
    console.log(err);
  }
};

exports.addEventComment = async (req, res) => {
  console.log('add comment controller response => ', req.body);
  try {
    const { postId, comment, image, user } = req.body;
    const eventPost = await Event.findOneAndUpdate(
      { 'post._id': postId },
      {
        $push: {
          'post.$.comments': { text: comment, image, postedBy: user._id },
        },
      },
      { new: true }
    );

    if (eventPost.postedBy != user._id) {
      const notify = await User.findByIdAndUpdate(
        eventPost.postedBy,
        {
          $push: {
            notifications: {
              notif: eventPost._id,
              action: 'commented post',
            },
          },
        },
        { new: true }
      ).populate('notif');
    }
    res.json(eventPost);
  } catch (err) {
    console.log(err);
  }
};

exports.removeEventComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    console.log('removeComment controller response', postId, comment);

    const eventPost = await Event.findOneAndUpdate(
      { 'post._id': postId },
      {
        $pull: {
          'post.$.comments': { _id: comment._id },
        },
      },
      { new: true }
    );
    res.json(eventPost);
  } catch (err) {
    console.log(err);
  }
};

exports.updateEventComment = async (req, res) => {
  console.log('updateComment controller response => ', req.body);

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

  const query = {
    'post._id': req.body.postId,
  };

  const updateComment = !image
    ? {
        $set: {
          'post.$[post].comments.$[comment].text': text,
        },
      }
    : {
        $set: {
          'post.$[post].comments.$[comment].text': text,
          'post.$[post].comments.$[comment].image': image,
        },
      };

  try {
    const comment = await Event.findOneAndUpdate(query, updateComment, {
      arrayFilters: [
        { 'post._id': { $eq: req.body.postId } },
        { 'comment._id': { $eq: req.body.comment._id } },
      ],
    });
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};
