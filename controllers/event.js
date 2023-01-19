const Event = require('../models/event');
const User = require('../models/user');
const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

exports.create = async (req, res) => {
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
    const sendNotif = await User.updateMany(
      { _id: { $in: req.body.invitees } },
      {
        $addToSet: {
          newNotifs: {
            action: 'You have been invited to an event',
            id: newEvent._id,
          },
        },
      },
      { new: true }
    );

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
  res.json(
    await Event.find({
      invitees: { $elemMatch: { _id: req.body._id } },
    }).exec()
  );
};

exports.fetchPrevEvents = async (req, res) => {
  res.json(
    await Event.find({
      invitees: { $elemMatch: { _id: req.body._id } },
      when: { $lt: new Date() },
    }).exec()
  );
};

exports.fetchComingEvents = async (req, res) => {
  res.json(
    await Event.find({
      invitees: { $elemMatch: { _id: req.body._id } },
      when: { $gt: new Date() },
    }).exec()
  );
};

exports.fetchEvent = async (req, res) => {
  res.json(
    await Event.findById(req.body.params.eventId)
      .populate('accepted', '_id name email profileImage username')
      .populate('maybe', '_id name email profileImage username')
      .populate('declined', '_id name email profileImage username')
      .populate('post.postedBy', '_id name email profileImage username')
      .populate('post.likes', '_id name email profileImage username')
      .populate(
        'post.comments.postedBy',
        '_id name email profileImage username'
      )
      .exec()
  );
};

exports.createEventPost = async (req, res) => {
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
        .populate('notif.likes', '_id name email profileImage username')
        .populate(
          'notif.comments.postedBy',
          '_id name email profileImage username'
        );
    }
    res.json(eventPost);
  } catch (err) {
    console.log(err);
  }
};

exports.unlikeEventPost = async (req, res) => {
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

exports.expiredEvent = async (req, res) => {
  const expired = await User.updateMany(
    { 'events.when': { $lte: new Date(Date.now()) } },
    { 'events.$[].expired': true }
  );
  res.json(expired);
};

exports.acceptEventInvite = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      {
        _id: req.body.post._id,
      },
      {
        $pull: { maybe: req.body.user._id, declined: req.body.user._id },
        $addToSet: { accepted: req.body.user._id },
      }
    ).populate('accepted', '_id name email profileImage username');
    const smallUser = await User.findById({ _id: req.body.user._id }).select(
      '_id name email username profileImage'
    );
    const notification = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'notifications.notif.createdAt': new Date(req.body.post.createdAt),
      },
      {
        $pull: {
          'notifications.$.notif.maybe': { mobile: req.user.phone_number },
          'notifications.$.notif.declined': { mobile: req.user.phone_number },
        },
        $addToSet: { 'notifications.$.notif.accepted': smallUser },
      }
    );
    const isGoing = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'events._id': req.body.post._id,
      },
      { $set: { 'events.$.going': 'yes' } }
    );
    res.json(isGoing);
  } catch (err) {
    console.log(err);
  }
};

exports.maybeEventInvite = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      {
        _id: req.body.post._id,
      },
      {
        $pull: { accepted: req.body.user._id, declined: req.body.user._id },
        $addToSet: { maybe: req.body.user._id },
      }
    ).populate('maybe', '_id name email profileImage username');
    const smallUser = await User.findById({ _id: req.body.user._id }).select(
      '_id name email username profileImage'
    );
    const notification = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'notifications.notif.createdAt': new Date(req.body.post.createdAt),
      },
      {
        $pull: {
          'notifications.$.notif.accepted': { mobile: req.user.phone_number },
          'notifications.$.notif.declined': { mobile: req.user.phone_number },
        },
        $addToSet: { 'notifications.$.notif.maybe': smallUser },
      }
    );
    const isGoing = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'events._id': req.body.post._id,
      },
      { $set: { 'events.$.going': 'maybe' } }
    );
    res.json(isGoing);
  } catch (err) {
    console.log(err);
  }
};

exports.declineEventInvite = async (req, res) => {
  const id = req.body.post._id;
  try {
    const event = await Event.findOneAndUpdate(
      {
        _id: req.body.post._id,
      },
      {
        $pull: { accepted: req.body.user._id, maybe: req.body.user._id },
        $addToSet: { declined: req.body.user._id },
      }
    ).populate('declined', '_id name email profileImage username');
    const smallUser = await User.findById({ _id: req.body.user._id }).select(
      '_id name email username profileImage'
    );
    const notification = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'notifications.notif.createdAt': new Date(req.body.post.createdAt),
      },
      {
        $pull: {
          'notifications.$.notif.accepted': { mobile: req.user.phone_number },
          'notifications.$.notif.maybe': { mobile: req.user.phone_number },
        },
        $addToSet: { 'notifications.$.notif.declined': smallUser },
      }
    );
    const isGoing = await User.findOneAndUpdate(
      {
        mobile: req.user.phone_number,
        'events._id': req.body.post._id,
      },
      { $set: { 'events.$.going': 'no' } }
    );
    res.json(isGoing);
  } catch (err) {
    console.log(err);
  }
};

exports.removeUserEvent = async (req, res) => {
  const { _id, event } = req.body;
  const removeEvent = await User.findByIdAndUpdate(
    { _id },
    { $pull: { events: { _id: event._id } } }
  );
  const removeInvite = await Event.findByIdAndUpdate(
    { _id: event._id },
    {
      $pull: { invitees: { _id } },
    }
  );
  const updateNotification = await User.findOneAndUpdate(
    {
      _id,
      'notifications.notif.createdAt': new Date(event.createdAt),
    },
    {
      $pull: {
        'notifications.$.notif.invitees': { mobile: req.user.phone_number },
        'notifications.$.notif.accepted': { mobile: req.user.phone_number },
        'notifications.$.notif.maybe': { mobile: req.user.phone_number },
        'notifications.$.notif.declined': { mobile: req.user.phone_number },
      },
    }
  );
  res.json(updateNotification);
};

exports.fetchEventUsers = async (req, res) => {
  try {
    const users = await User.find({ eventsEligible: true }).select(
      '_id name email profileImage featuredMember role pointsGained pointsLost pointsSpent username userStatus mobile eventsEligible'
    );
    res.json(users);
  } catch (err) {
    console.log('users => ', err);
  }
};

exports.numUpcomingEvents = async (req, res) => {
  const { _id } = req.body;
  try {
    const user = await User.findById({ _id });
    const events = user.events;
    const upcoming = [];
    events.map((e) => e.expired === false && upcoming.push(e._id));
    const numOfUpcoming = upcoming.length;
    res.json(numOfUpcoming);
  } catch (err) {
    console.log(err);
  }
};
