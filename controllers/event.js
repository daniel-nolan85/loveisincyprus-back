const Event = require('../models/event');
const User = require('../models/user');

exports.create = async (req, res) => {
  try {
    // console.log('create event controller response => ', req.body);
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
