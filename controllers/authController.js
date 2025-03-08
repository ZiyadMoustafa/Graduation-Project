const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const Client = require('../models/clientModel');
const User = require('../models/userModel');

// create token
const signToken = (id, role) =>
  jwt.sign({ userId: id, role: role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// send token in cookie
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.clientSignUp = catchAsync(async (req, res, next) => {
  const {
    fullName,
    email,
    mobileNumber,
    password,
    passwordConfirm,
    gender,
    age,
    weight,
    height,
    goal,
    physicalActivityLevel,
  } = req.body;

  // check if user exist
  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new AppError('This user already exist', 400));

  const newUser = await User.create({
    email,
    password,
    passwordConfirm,
    role: 'client',
  });

  try {
    // Create Client
    await Client.create({
      userId: newUser._id,
      fullName,
      email,
      mobileNumber,
      password,
      passwordConfirm,
      gender,
      age,
      weight,
      height,
      goal,
      physicalActivityLevel,
    });

    createSendToken(newUser, 200, res);
  } catch (error) {
    await User.findByIdAndDelete(newUser._id);
    return next(new AppError(error, 400));
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and passowrd exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) check if client exist and password correct
  const user = await User.findOne({ email }).select('+password');

  if (
    !user ||
    !(await user.correctPassword(req.body.password, user.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) if everything is ok , send response

  createSendToken(user, 200, res);
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) get user
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('This user not exist', 404));

  // 2) generate the random reset code (5 digit)
  const resetCode = user.createPasswordResetCode();
  await user.save({ validateBeforeSave: false });

  // 3) send email to user
  try {
    let htmlTemplate = fs.readFileSync(
      path.join(__dirname, '../views/otpTemplate.html'),
      'utf8',
    );

    // Replace placeholders with actual values
    htmlTemplate = htmlTemplate.replace('{{OTP}}', resetCode);

    await sendEmail({
      email: user.email,
      subject: 'Reset Password',
      htmlTemplate,
    });

    res.status(200).json({
      status: 'success',
      message: 'Email sent successfully, check your email',
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new AppError(err, 500));
  }
});

exports.verifyPassResetCode = catchAsync(async (req, res, next) => {
  const { resetCode } = req.body;

  const hashedResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Reset code invalid or expired', 404));

  user.passwordResetVerified = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    userId: user._id,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get and find user based on id
  const user = await User.findById(req.params.id);

  if (!user) return next(new AppError('User not exist', 404));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password Changed successfully',
  });
});
