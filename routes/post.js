const express = require('express');
const formidable = require('express-formidable');

const router = express.Router();

// middleware
const { authCheck, adminCheck } = require('../middleware/auth');
const {
  canEditDeletePost,
  canDeleteComment,
  canEditComment,
} = require('../middleware/post');

// controllers
const {
  createPost,
  uploadImage,
  postsByUser,
  userPost,
  updatePost,
  deletePost,
  reportPost,
  newsFeed,
  likePost,
  unlikePost,
  addComment,
  removeComment,
  updateComment,
  reportComment,
  totalPosts,
  thisUsersPosts,
  totalPostsByUser,
  totalPostsByThisUser,
  followersPosts,
  deletePostPic,
  //admin
  posts,
  adminRemoveComment,
  fetchReportedPosts,
  fetchReportedComments,
} = require('../controllers/post');

// routes
router.post('/create-post', authCheck, createPost);
router.post(
  '/upload-image',
  authCheck,
  formidable({ maxFileSize: 5 * 1024 * 1024 }),
  uploadImage
);
router.post('/user-posts/:page', authCheck, postsByUser);
router.post('/user-post/:postId', authCheck, userPost);
router.put('/update-post/:postId', authCheck, canEditDeletePost, updatePost);
router.put('/delete-post/:postId', authCheck, canEditDeletePost, deletePost);
router.put('/report-post/:postId', authCheck, reportPost);
router.post('/news-feed/:page', authCheck, newsFeed);
router.put('/like-post', authCheck, likePost);
router.put('/unlike-post', authCheck, unlikePost);
router.put('/add-comment', authCheck, addComment);
router.put('/remove-comment', authCheck, canDeleteComment, removeComment);
router.put('/update-comment', authCheck, canEditComment, updateComment);
router.put('/report-comment', authCheck, reportComment);
router.get('/total-posts', totalPosts);
router.post('/this-users-posts/:page', thisUsersPosts);
router.post('/total-posts-by-user', totalPostsByUser);
router.post('/total-posts-by-this-user', totalPostsByThisUser);
router.post('/followers-posts', followersPosts);
router.put('/post-picture-delete', authCheck, deletePostPic);

// admin
router.put('/admin/delete-post/:postId', authCheck, adminCheck, deletePost);
router.post('/posts', authCheck, adminCheck, posts);
router.put('/admin-remove-comment', authCheck, adminCheck, adminRemoveComment);
router.post('/fetch-reported-posts', fetchReportedPosts);
router.post('/fetch-reported-comments', fetchReportedComments);

module.exports = router;
