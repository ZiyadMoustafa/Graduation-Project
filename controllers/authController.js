const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const Client = require('../models/clientModel');

// create token
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// send token in cookie
const createSendToken = (client, statusCode, res) => {
  const token = signToken(client._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove password from output
  client.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: {
      client,
    },
  });
};

exports.clientSignUp = catchAsync(async (req, res, next) => {
  const newClient = await Client.create(req.body);

  createSendToken(newClient, 200, res);
});

exports.clientLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and passowrd exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) check if client exist and password correct
  const client = await Client.findOne({ email }).select('+password');

  if (
    !client ||
    !(await client.correctPassword(req.body.password, client.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) if everything is ok , send response

  createSendToken(client, 200, res);
});
