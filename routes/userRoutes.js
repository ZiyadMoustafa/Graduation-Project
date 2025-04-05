const express = require('express');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/adminSignup', authController.adminSignup);
router.post('/clientSignUp', authController.clientSignUp);
router.post(
  '/serviceProviderSignUp',
  authController.uploadPhoto,
  authController.resizePhotoAndUpload,
  authController.serviceProviderSignUp,
);
router.post('/Login', authController.login);
router.get('/Logout', authController.logout);

router.post('/forgetPassword', authController.forgetPassword);
router.post('/verifyOTP', authController.verifyPassResetCode);
router.patch('/resetPassword/:id', authController.resetPassword);

router.use(authController.protect);

router.get('/getClientById', userController.getClient);
router.get(
  '/getServiceProviderById',
  userController.getMe,
  userController.getServiceProvider,
);
router.get('/getAllCoaches', userController.getAllCoaches);
router.get('/getCoachById/:id', userController.getCoachById);

router.get('/getAllNutritionists', userController.getAllNutritionists);
router.get('/getNutritionistById/:id', userController.getNutritionistById);

router.get(
  '/getAllPhysicalTherapists',
  userController.getAllPhysicalTherapists,
);
router.get(
  '/getPhysicalTherapyById/:id',
  userController.getPhysicalTherapyById,
);

router.get('/', authController.restrictTo('admin'), userController.getAllUsers);
router.patch('/updateMyPassword', authController.updateMyPassword);
router.delete('/deleteMe', userController.deleteMe);

module.exports = router;
