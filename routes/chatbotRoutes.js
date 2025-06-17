const express = require('express');

const chatbotController = require('../controllers/chatbotController');

const router = express.Router();

router.post('/chatWithGemini', chatbotController.chatWithGemini);

module.exports = router;
