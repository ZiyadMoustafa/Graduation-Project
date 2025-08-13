const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');
const cloud = require('../utils/cloud');

const Client = require('../models/clientModel');
const ServiceProvider = require('../models/serviceproviderModel');
const User = require('../models/userModel');

// ***********************************************************************************
const multerStorage = multer.memoryStorage();

// File filter to allow only images
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Only images are allowed!', 404), false);
  }
};

// Multer configuration
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
});

exports.uploadPhoto = upload.single('identifier');

const uploadToCloudinary = (buffer, filename, folderPath) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloud.uploader.upload_stream(
      {
        folder: folderPath,
        public_id: filename,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );
    uploadStream.end(buffer);
  });

// Middleware to Process and Upload Image to Cloudinary
exports.resizePhotoAndUpload = catchAsync(async (req, res, next) => {
  const { fileTypeFromBuffer } = await import('file-type');

  if (!req.file) return next();

  const folderPath = 'Graduation/Service-Provider';

  // check file type
  const fileType = await fileTypeFromBuffer(req.file.buffer);
  if (!fileType || !['image/jpeg', 'image/png'].includes(fileType.mime)) {
    throw new AppError('نوع الصورة غير مدعوم', 400);
  }

  // Resize with sharp
  const imageBuffer = await sharp(req.file.buffer)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();

  const uniqueFileName = uuidv4();

  const result = await uploadToCloudinary(
    imageBuffer,
    uniqueFileName,
    folderPath,
  );

  req.body.identifier = result.secure_url;

  next();
});
// ***********************************************************************************

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
    sameSite: 'None',
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: {
      user,
      token,
    },
  });
};

exports.adminSignup = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new AppError('This user already exist', 400));

  const newAdmin = await User.create({
    email,
    password,
    passwordConfirm,
    role: 'admin',
  });

  createSendToken(newAdmin, 200, res);
});

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

exports.serviceProviderSignUp = catchAsync(async (req, res, next) => {
  const {
    fullName,
    email,
    mobileNumber,
    password,
    passwordConfirm,
    job,
    gender,
    age,
    yearsOfExperience,
    jobTitle,
    bio,
    identifier,
    priceRange,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return next(new AppError('This user is already exist', 400));

  const newUser = await User.create({
    email,
    password,
    passwordConfirm,
    role: 'service_provider',
    status: 'pending',
  });

  try {
    await ServiceProvider.create({
      userId: newUser._id,
      fullName,
      mobileNumber,
      job,
      gender,
      age,
      yearsOfExperience,
      jobTitle,
      bio,
      identifier,
      priceRange,
      status: 'pending',
    });
    res.status(201).json({
      status: 'success',
      message:
        'The account was created successfully. Please wait for approval from the admin.',
    });
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

  // 3) check account type
  if (user.role === 'service_provider' && user.status === 'pending') {
    return next(
      new AppError(
        ' You cannot log in currently. Your account is under review by the admin',
        400,
      ),
    );
  }

  // 4) if everything is ok , send response

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

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// function for Authoraization
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in , Please login to get access', 401),
    );
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exist
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser)
    return next(new AppError('This user does no longer exist', 400));

  // 4) check if password chaged after create token
  if (currentUser.changePasswordAfter(decoded.iat))
    return next(
      new AppError('Password recently changed! , please log in again', 401),
    );

  req.user = currentUser;
  next();
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  // 1) Get user
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('The user does not exist', 404));
  }

  // 2) check current password is correct
  const isMatch = await user.correctPassword(
    req.body.currentPassword,
    user.password,
  );
  if (!isMatch)
    return next(
      new AppError(
        'The password that you entered not equal the original one',
        404,
      ),
    );

  // 3) if OK , change password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // continue using the app
  createSendToken(user, 200, res);
});
