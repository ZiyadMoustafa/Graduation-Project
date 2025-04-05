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

// full name , bio , price
exports.getAllCoaches = catchAsync(async (req, res, next) => {
  const coaches = await ServiceProvider.find({ job: 'Work Out' }).select(
    'fullName bio priceRange',
  );

  res.status(200).json({
    status: 'success',
    results: coaches.length,
    data: {
      coaches,
    },
  });
});

exports.getCoachById = catchAsync(async (req, res, next) => {
  const coach = await ServiceProvider.findById(req.params.id).populate(
    'userId',
  );

  res.status(200).json({
    status: 'success',
    data: {
      coach,
    },
  });
});

exports.getAllNutritionists = catchAsync(async (req, res, next) => {
  const Nutritionists = await ServiceProvider.find({
    job: 'Nutirion',
  }).select('fullName bio priceRange');

  res.status(200).json({
    status: 'success',
    results: Nutritionists.length,
    data: {
      Nutritionists,
    },
  });
});

exports.getNutritionistById = catchAsync(async (req, res, next) => {
  const Nutritionist = await ServiceProvider.findById(req.params.id).populate(
    'userId',
  );

  res.status(200).json({
    status: 'success',
    data: {
      Nutritionist,
    },
  });
});

exports.getAllPhysicalTherapists = catchAsync(async (req, res, next) => {
  const PhysicalTherapists = await ServiceProvider.find({
    job: 'Physical Therapy',
  }).select('fullName bio priceRange');

  res.status(200).json({
    status: 'success',
    results: PhysicalTherapists.length,
    data: {
      PhysicalTherapists,
    },
  });
});

exports.getPhysicalTherapyById = catchAsync(async (req, res, next) => {
  const PhysicalTherapy = await ServiceProvider.findById(
    req.params.id,
  ).populate('userId');

  res.status(200).json({
    status: 'success',
    data: {
      PhysicalTherapy,
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
