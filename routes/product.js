const express = require('express');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');

// controllers
const {
  create,
  productsCount,
  listAll,
  read,
  remove,
  update,
  list,
  productStar,
  listRelated,
  searchFilters,
  fetchProductsToReview,
  disapproveProduct,
  approveProduct,
} = require('../controllers/product');

// routes
router.post('/product', authCheck, adminCheck, create);
router.get('/products/total', productsCount);
router.get('/products/:count', listAll);
router.get('/product/:slug', read);
router.delete('/product/:slug', authCheck, adminCheck, remove);
router.put('/product/:slug', authCheck, adminCheck, update);
router.post('/products', list);
router.put('/product/star/:productId', authCheck, productStar);
router.get('/product/related/:productId', listRelated);
router.post('/search/filters', searchFilters);
router.post('/fetch-products-to-review', fetchProductsToReview);
router.delete(
  '/disapprove-product/:slug',
  authCheck,
  adminCheck,
  disapproveProduct
);
router.put('/approve-product', authCheck, adminCheck, approveProduct);

module.exports = router;
