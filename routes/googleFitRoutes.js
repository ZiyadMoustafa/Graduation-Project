const express = require('express');

const router = express.Router();
const googleFitController = require('../controllers/googleFitController');
const authController = require('../controllers/authController');

router.get(
  '/my-data',
  authController.protect,
  googleFitController.getUserFitData,
);

router.get(
  '/raw-data',
  authController.protect,
  googleFitController.getMyFitnessData,
);

router.get('/auth-url', googleFitController.getAuthURL);

router.get(
  '/oauth2callback',
  authController.protect,
  googleFitController.oauth2callback,
);

router.get(
  '/refresh-my-data',
  authController.protect,
  googleFitController.refreshAndGetData,
);

module.exports = router;
