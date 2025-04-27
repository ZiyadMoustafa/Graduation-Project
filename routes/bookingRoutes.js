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

router.patch(
  '/respondOfBooking/:bookingId',
  authController.restrictTo('service_provider'),
  bookingController.respondOfBooking,
);

router.get(
  '/getAcceptedBookingsForServiceProvider',
  authController.restrictTo('service_provider'),
  bookingController.getAcceptedBookingsForServiceProvider,
);

router.get(
  '/getAcceptedBookingsForClient',
  authController.restrictTo('client'),
  bookingController.getAcceptedBookingsForClient,
);

router.get('/getChatMessages/:bookingId', bookingController.getChatMessages);

router.get(
  '/getAllBookings',
  authController.restrictTo('admin'),
  bookingController.getAllBookings,
);

module.exports = router;
