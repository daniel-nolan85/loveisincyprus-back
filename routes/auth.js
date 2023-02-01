const express = require('express');

const router = express.Router();

// middleware
const {
  authCheck,
  adminCheck,
  subscriberCheck,
  addFollower,
  removeFollower,
} = require('../middleware/auth');

// controllers
const {
  userExists,
  secondMobileExists,
  emailExists,
  userPermitted,
  userBlocked,
  secondMobileBlocked,
  callingCode,
  secondMobileCallingCode,
  checkCredentials,
  createUser,
  loginUser,
  loginUserWithSecret,
  updateMobileNumbers,
  updateFirestoreUser,
  currentUser,
  checkInfoExists,
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
  cropCover,
  cropProfile,
  liveProfilePic,
  nineMatches,
  usersToSwipe,
  leftSwipe,
  fetchVisitor,
  nineVisitors,
  ninePhotos,
  usersNinePhotos,
  fetchWhitelist,
  // admin
  users,
  suspendUser,
  revokeUser,
  deleteUser,
  deleteSelf,
  recentUsers,
  recentOrders,
  fetchLocations,
  handleWhitelist,
  searchLocations,
  searchCodes,
  fetchCodes,
  handlePermitted,
  addUserToAdmin,
  removeUserFromAdmin,
  addUserToFeaturedMembers,
  removeUserFromFeaturedMembers,
  addUserToEventsEligible,
  removeUserFromEventsEligible,
  fetchFeaturedMembers,
  removeExpiredFeatures,
  dailyMatches,
  dailySignups,
} = require('../controllers/auth');

// routes
router.get('/user-exists/:mobile', userExists);
router.get('/second-mobile-exists/:secondMobile', secondMobileExists);
router.get('/email-exists/:email', emailExists);
router.get('/user-permitted/:mobile', userPermitted);
router.get('/user-blocked/:mobile', userBlocked);
router.get('/second-mobile-blocked/:secondMobile', secondMobileBlocked);
router.get('/calling-code/:mobile', callingCode);
router.get(
  '/second-mobile-calling-code/:secondMobile',
  secondMobileCallingCode
);
router.get('/check-credentials/:email', checkCredentials);
router.post('/create-user', authCheck, createUser);
router.post('/login-user', authCheck, loginUser);
router.post('/login-user-with-secret', authCheck, loginUserWithSecret);
router.put('/update-mobile-numbers', updateMobileNumbers);
router.put('/update-firestore-user', updateFirestoreUser);
router.post('/check-info-exists', authCheck, checkInfoExists);
router.put('/profile-update', authCheck, profileUpdate);
router.post('/current-user', authCheck, currentUser);
router.post('/current-admin', authCheck, adminCheck, currentUser);
router.post('/current-subscriber', authCheck, subscriberCheck, currentUser);
router.post('/find-users', authCheck, findUsers);
router.put('/user-follow', authCheck, subscriberCheck, addFollower, userFollow);
router.put(
  '/user-unfollow',
  authCheck,
  subscriberCheck,
  removeFollower,
  userUnfollow
);
router.post('/liked-users', authCheck, userFollowing);
router.post('/users-who-like-me', authCheck, userFollowers);
router.post('/my-matches', authCheck, userMatches);
router.post('/my-visitors', authCheck, userVisitors);
router.post('/search-user/:query', authCheck, searchUser);
router.post('/user/:userId', authCheck, userProfile);
router.post('/crop-cover', authCheck, cropCover);
router.post('/crop-profile', authCheck, cropProfile);
router.post('/live-profile-pic', authCheck, liveProfilePic);
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
router.put('/admin/suspend-user/:userId', authCheck, adminCheck, suspendUser);
router.put(
  '/admin/revoke-suspension/:userId',
  authCheck,
  adminCheck,
  revokeUser
);
router.put('/admin/delete-user/:userId', authCheck, adminCheck, deleteUser);
router.put('/delete-self/:userId', authCheck, deleteSelf);
router.post('/recent-users', authCheck, adminCheck, recentUsers);
router.post('/recent-orders', authCheck, adminCheck, recentOrders);
router.post('/admin/search-locations', authCheck, adminCheck, searchLocations);
router.post('/admin/fetch-locations', authCheck, adminCheck, fetchLocations);
router.post('/admin/handle-whitelist', authCheck, adminCheck, handleWhitelist);
router.post('/admin/search-codes', authCheck, adminCheck, searchCodes);
router.post('/admin/fetch-codes', authCheck, adminCheck, fetchCodes);
router.post('/admin/handle-permitted', authCheck, adminCheck, handlePermitted);
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
router.put(
  '/admin/add-user-to-events-eligible',
  authCheck,
  adminCheck,
  addUserToEventsEligible
);
router.put(
  '/admin/remove-user-from-events-eligible',
  authCheck,
  adminCheck,
  removeUserFromEventsEligible
);
router.get('/fetch-featured-members', fetchFeaturedMembers);
router.put('/remove-expired-features', removeExpiredFeatures);
router.get('/daily-matches', dailyMatches);
router.get('/daily-signups', dailySignups);

module.exports = router;
