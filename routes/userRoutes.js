const express = require('express');

const authController = require('../controllers/authController');

const router = express.Router();

router.post('/clientSignUp', authController.clientSignUp);
router.post('/clientLogin', authController.clientLogin);

module.exports = router;
