const Sub = require('../models/sub');
const slugify = require('slugify');

exports.create = async (req, res) => {
  try {
    const { name, parent } = req.body;
    res.json(
      await new Sub({
        name,
        parent,
        slug: slugify(name).toLowerCase(),
      }).save()
    );
  } catch (err) {
    console.log(err);
    res.status(400).send('Create sub failed');
  }
};

exports.list = async (req, res) => {
  res.json(await Sub.find({}).sort({ name: 1 }).exec());
};

exports.read = async (req, res) => {
  res.json(await Sub.findOne({ slug: req.params.slug }).exec());
};

exports.update = async (req, res) => {
  const { name, parent } = req.body;
  try {
    res.json(
      await Sub.findOneAndUpdate(
        { slug: req.params.slug },
        { name, parent, slug: slugify(name) },
        { new: true }
      )
    );
  } catch (err) {
    console.log(err);
    res.status(400).send('Update sub failed');
  }
};

exports.remove = async (req, res) => {
  try {
    res.json(await Sub.findOneAndDelete({ slug: req.params.slug }));
  } catch (err) {
    console.log(err);
    res.status(400).send('Delete sub failed');
  }
};
