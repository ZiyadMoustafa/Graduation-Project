const express = require('express');
const articleController = require('../controllers/articleController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(authController.protect);

router.post(
  '/addArticle',
  authController.restrictTo('service_provider'),
  articleController.uploadPhoto,
  articleController.resizePhotoAndUpload,
  articleController.addArticle,
);

router.get('/getallarticle', articleController.getAllArticles);

router.get('/getArticle/:id', articleController.getArticle);
module.exports = router;
