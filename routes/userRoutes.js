const express = require('express');

const authController = require('../controllers/authController');

const router = express.Router();

router.post('/clientSignUp', authController.clientSignUp);
router.post('/Login', authController.login);

module.exports = router;
