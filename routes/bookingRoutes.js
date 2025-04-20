const express = require('express');

const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.post(
  '/checkout-session/:serviceproviderID',
  bookingController.getCheckoutSession,
);

router.get(
  '/getMyNewBookings',
  authController.restrictTo('service_provider'),
  bookingController.getMyNewBookings,
);
router.get(
  '/getAllBookings',
  authController.restrictTo('admin'),
  bookingController.getAllBookings,
);

module.exports = router;
