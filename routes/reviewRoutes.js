const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(authController.protect);

router.post(
  '/addReview',
  authController.restrictTo('client'),
  reviewController.addReview,
);

router.get('/getallReviews', reviewController.getAllReviews);
router.get(
  '/topRatedServiceProviders',
  reviewController.getTopRatedProvidersByCategory,
);
router.get('/getReview/:id', reviewController.getReview);
module.exports = router;
