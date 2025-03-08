const express = require('express');

const authController = require('../controllers/authController');

const router = express.Router();

router.post('/clientSignUp', authController.clientSignUp);
router.post('/Login', authController.login);
router.post('/forgetPassword', authController.forgetPassword);
router.post('/verifyOTP', authController.verifyPassResetCode);
router.patch('/resetPassword/:id', authController.resetPassword);

module.exports = router;
