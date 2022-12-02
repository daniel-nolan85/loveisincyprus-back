const Product = require('../models/product');
const User = require('../models/user');
const slugify = require('slugify');

exports.create = async (req, res) => {
  try {
    console.log('create product controller response => ', req.body);
    req.body.slug = slugify(req.body.title);
    const newProduct = await new Product(req.body).save();
    res.json(newProduct);
  } catch (err) {
    console.log(err);
    // res.status(400).send('Create product failed');
    res.status(400).json({
      err: err.message,
    });
  }
};

exports.productsCount = async (req, res) => {
  const total = await Product.find({}).estimatedDocumentCount().exec();
  res.json(total);
};

exports.listAll = async (req, res) => {
  const products = await Product.find({ approved: true })
    .limit(parseInt(req.params.count))
    .populate('category')
    .populate('subs')
    .sort([['createdAt', 'desc']])
    .exec();
  res.json(products);
};

exports.read = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('category')
    .populate('subs')
    .exec();
  res.json(product);
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Product.findOneAndRemove({
      slug: req.params.slug,
    }).exec();
    res.json(deleted);
  } catch (err) {
    console.log(err);
    return res.status(400).send('Delete product failed');
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const updated = await Product.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true }
    ).exec();
    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send('Update product failed');
  }
};

// exports.list = async (req, res) => {
//   try {
//     const { sort, order, limit } = req.body;
//     const products = await Product.find({})
//       .populate('category')
//       .populate('subs')
//       .sort([[sort, order]])
//       .limit(limit)
//       .exec();
//     res.json(products);
//   } catch (err) {
//     console.log(err);
//   }
// };

exports.list = async (req, res) => {
  try {
    const { sort, order, page } = req.body;
    const currentPage = page || 1;
    const perPage = 3;
    const products = await Product.find({ approved: true })
      .skip((currentPage - 1) * perPage)
      .populate('category')
      .populate('subs')
      .sort([[sort, order]])
      .limit(perPage)
      .exec();
    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

exports.productStar = async (req, res) => {
  const product = await Product.findById(req.params.productId).exec();
  const user = await User.findOne({ mobile: req.user.phone_number }).exec();
  const { star } = req.body;
  let existingRatingObject = product.ratings.find(
    (el) => el.postedBy.toString() === user._id.toString()
  );
  if (existingRatingObject === undefined) {
    let ratingAdded = await Product.findByIdAndUpdate(
      product._id,
      {
        $push: { ratings: { star, postedBy: user._id } },
      },
      { new: true }
    ).exec();
    console.log('ratingAdded => ', ratingAdded);
    res.json(ratingAdded);
  } else {
    const ratingUpdated = await Product.updateOne(
      {
        ratings: { $elemMatch: existingRatingObject },
      },
      { $set: { 'ratings.$.star': star } },
      { new: true }
    ).exec();
    console.log('ratingUpdated => ', ratingUpdated);
    res.json(ratingUpdated);
  }
};

exports.listRelated = async (req, res) => {
  const product = await Product.findById(req.params.productId).exec();
  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
  })
    .limit(3)
    .populate('category')
    .populate('subs')
    .populate('postedBy')
    .exec();
  res.json(related);
};

const handleQuery = async (req, res, query) => {
  const products = await Product.find({ $text: { $search: query } })
    .populate('category', '_id name')
    .populate('subs', '_id name')
    .populate('postedBy', '_id name')
    .exec();
  res.json(products);
};

const handlePrice = async (req, res, price) => {
  try {
    const products = await Product.find({
      price: { $gte: price[0], $lte: price[1] },
    })
      .populate('category', '_id name')
      .populate('subs', '_id name')
      .populate('postedBy', '_id name')
      .exec();
    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

const handleStar = async (req, res, stars) => {
  Product.aggregate([
    {
      $project: {
        document: '$$ROOT',
        floorAverage: {
          $floor: { $avg: '$ratings.star' },
        },
      },
    },
    { $match: { floorAverage: stars } },
  ]).exec((err, aggregates) => {
    if (err) console.log('aggregate error => ', err);
    Product.find({ _id: aggregates })
      .populate('category', '_id name')
      .populate('subs', '_id name')
      .populate('postedBy', '_id name')
      .exec((err, products) => {
        if (err) console.log('aggregate error => ', err);
        res.json(products);
      });
  });
};

const handleCategory = async (req, res, category) => {
  try {
    const products = await Product.find({
      category,
    })
      .populate('category', '_id name')
      .populate('subs', '_id name')
      .populate('postedBy', '_id name')
      .exec();
    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

const handleSub = async (req, res, sub) => {
  try {
    const products = await Product.find({
      subs: sub,
    })
      .populate('category', '_id name')
      .populate('subs', '_id name')
      .populate('postedBy', '_id name')
      .exec();
    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

exports.searchFilters = async (req, res) => {
  const { query, price, stars, category, sub } = req.body;

  if (query) {
    console.log('query', query);
    await handleQuery(req, res, query);
  }
  if (price !== undefined) {
    console.log('price => ', price);
    await handlePrice(req, res, price);
  }
  if (stars) {
    console.log('stars => ', stars);
    await handleStar(req, res, stars);
  }
  if (category) {
    console.log('category => ', category);
    await handleCategory(req, res, category);
  }
  if (sub) {
    console.log('sub => ', sub);
    await handleSub(req, res, sub);
  }
};

exports.fetchProductsToReview = async (req, res) => {
  try {
    const products = await Product.find({ approved: false })
      .populate('category', '_id name slug')
      .populate('subs', '_id name slug')
      .populate('postedBy', '_id name')
      .sort({
        createdAt: -1,
      });
    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

exports.approveProduct = async (req, res) => {
  console.log('approveProduct controller response => ', req.body);
  const { product } = req.body;
  const approveProduct = await Product.findByIdAndUpdate(
    product._id,
    { approved: true },
    { new: true }
  ).exec();
  res.json(approveProduct);
};

exports.disapproveProduct = async (req, res) => {
  console.log('disapproveProduct controller response => ', req.params);
  try {
    const product = await Product.findOneAndRemove({
      slug: req.params.slug,
    }).exec();
    res.json(product);
  } catch {
    console.log(err);
    return res.status(400).send('Delete product failed');
  }
};
