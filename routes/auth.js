const express = require('express');

const router = express.Router();

// middleware
const {
  authCheck,
  adminCheck,
  addFollower,
  removeFollower,
} = require('../middleware/auth');

// controllers
const {
  createOrUpdateUser,
  currentUser,
  profileUpdate,
  findUsers,
  userFollow,
  userFollowing,
  userUnfollow,
  userFollowers,
  userMatches,
  userVisitors,
  searchUser,
  userProfile,
  // cropImage,
  cropCover,
  cropProfile,
  nineMatches,
  usersToSwipe,
  leftSwipe,
  fetchVisitor,
  nineVisitors,
  ninePhotos,
  usersNinePhotos,
  fetchWhitelist,
  //admin
  users,
  deleteUser,
  recentUsers,
  searchPosts,
  fetchLocations,
  handleWhitelist,
  searchLocations,
  addUserToAdmin,
  removeUserFromAdmin,
  addUserToFeaturedMembers,
  removeUserFromFeaturedMembers,
} = require('../controllers/auth');

// routes
router.post('/create-or-update-user', authCheck, createOrUpdateUser);
router.put('/profile-update', authCheck, profileUpdate);
router.post('/current-user', authCheck, currentUser);
router.post('/current-admin', authCheck, adminCheck, currentUser);
router.post('/find-users', authCheck, findUsers);
router.put('/user-follow', authCheck, addFollower, userFollow);
router.put('/user-unfollow', authCheck, removeFollower, userUnfollow);
router.post('/liked-users', authCheck, userFollowing);
router.post('/users-who-like-me', authCheck, userFollowers);
router.post('/my-matches', authCheck, userMatches);
router.post('/my-visitors', authCheck, userVisitors);
router.post('/search-user/:query', authCheck, searchUser);
router.post('/user/:userId', authCheck, userProfile);
// router.post('/crop-image', authCheck, cropImage);
router.post('/crop-cover', authCheck, cropCover);
router.post('/crop-profile', authCheck, cropProfile);
router.post('/nine-matches', authCheck, nineMatches);
router.post('/users-to-swipe', authCheck, usersToSwipe);
router.post('/left-swipe', authCheck, leftSwipe);
router.post('/fetch-visitor', authCheck, fetchVisitor);
router.post('/nine-visitors', authCheck, nineVisitors);
router.post('/nine-photos', authCheck, ninePhotos);
router.post('/users-nine-photos', authCheck, usersNinePhotos);
router.get('/fetch-whitelist', fetchWhitelist);

// admin
router.post('/users', authCheck, adminCheck, users);
router.put('/admin/delete-user/:userId', authCheck, adminCheck, deleteUser);
router.post('/recent-users', authCheck, adminCheck, recentUsers);
router.post('/admin/search-posts/:query', authCheck, adminCheck, searchPosts);
router.post('/admin/search-users/:query', authCheck, adminCheck, searchUser);
router.post('/admin/search-locations', authCheck, adminCheck, searchLocations);
router.post('/admin/fetch-locations', authCheck, adminCheck, fetchLocations);
router.post('/admin/handle-whitelist', authCheck, adminCheck, handleWhitelist);
router.put('/admin/add-user-to-admin', authCheck, adminCheck, addUserToAdmin);
router.put(
  '/admin/remove-user-from-admin',
  authCheck,
  adminCheck,
  removeUserFromAdmin
);
router.put(
  '/admin/add-user-to-featured-members',
  authCheck,
  adminCheck,
  addUserToFeaturedMembers
);
router.put(
  '/admin/remove-user-from-featured-members',
  authCheck,
  adminCheck,
  removeUserFromFeaturedMembers
);

module.exports = router;
