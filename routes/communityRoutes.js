const express = require('express');
const communityController = require('../controllers/communityController');
const authController = require('../controllers/authController');
const likeController = require('../controllers/likeController');
const commentController = require('../controllers/commentController');

const router = express.Router();

router.use(authController.protect);

router.post(
  '/createPost',
  authController.restrictTo('client'),
  communityController.uploadPhoto,
  communityController.resizePhotoAndUpload,
  communityController.createCommunity,
);

router.get('/getAllPosts', communityController.getAllCommunities);

router.patch('/:id/like', likeController.Like);

router.post('/:id/createComment', commentController.addComment);

router.get('/:id/allComments', commentController.getComments);

module.exports = router;
