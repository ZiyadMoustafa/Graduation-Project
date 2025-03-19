const catchAsync = require('../utils/catchAsync');

const Client = require('../models/clientModel');
const ServiceProvider = require('../models/serviceproviderModel');
const User = require('../models/userModel');

exports.getMe = (req, res, next) => {
  req.params.id = req.user.userId;
  next();
};

exports.getClient = catchAsync(async (req, res, next) => {
  const client = await Client.find({ userId: req.user.id }).populate('userId');

  res.status(200).json({
    status: 'success',
    data: {
      client,
    },
  });
});

exports.getServiceProvider = catchAsync(async (req, res, next) => {
  const serviceProvider = await ServiceProvider.find({
    userId: req.user.id,
  }).populate('userId');

  res.status(200).json({
    status: 'success',
    data: {
      serviceProvider,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'succes',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateClient = catchAsync(async (req, res, next) => {});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
