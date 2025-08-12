const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const Client = require('../models/clientModel');
const ServiceProvider = require('../models/serviceproviderModel');
const User = require('../models/userModel');

// exports.getMe = (req, res, next) => {
//   req.params.id = req.user.userId;
//   next();
// };

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

exports.getAllSuspendedServiceProviders = catchAsync(async (req, res, next) => {
  const serviceProviders = await ServiceProvider.find({
    status: 'pending',
  }).populate('userId');

  res.status(200).json({
    status: 'success',
    result: serviceProviders.length,
    data: {
      serviceProviders,
    },
  });
});

exports.respondOfRequests = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  const existingUser = await User.findById(req.params.id);
  const existingServiceProvider = await ServiceProvider.findOne({
    userId: req.params.id,
  });

  if (!existingUser) return next(new AppError('No User found', 404));

  existingUser.status = status;
  existingServiceProvider.status = status;

  if (existingUser.status === 'reject') {
    await ServiceProvider.findOneAndDelete({ userId: req.params.id });
    await User.findByIdAndDelete(req.params.id);
  } else {
    await existingUser.save({ validateBeforeSave: false });
    await existingServiceProvider.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    status: 'success',
  });
});

exports.getAllClients = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const Clients = await Client.find().skip(skip).limit(limit);

  res.status(200).json({
    status: 'success',
    results: Clients.length,
    data: {
      Clients,
    },
  });
});

exports.getAllServiceProviders = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const ServiceProviders = await ServiceProvider.find().skip(skip).limit(limit);

  res.status(200).json({
    status: 'success',
    results: ServiceProviders.length,
    data: {
      ServiceProviders,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find().skip(skip).limit(limit);

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getAllstats = catchAsync(async (req, res, next) => {
  const users = await User.find();
  const Clients = await Client.find();
  const ServiceProviders = await ServiceProvider.find({
    status: 'accept',
  });
  const suspendedServiceProviders = await ServiceProvider.find({
    status: 'pending',
  });

  res.status(200).json({
    status: 'success',
    users: users.length,
    Clients: Clients.length,
    ServiceProviders: ServiceProviders.length,
    suspendedServiceProviders: suspendedServiceProviders.length,
  });
});

// full name , bio , price
exports.getAllCoaches = catchAsync(async (req, res, next) => {
  const coaches = await ServiceProvider.find({ job: 'Work Out' }).select(
    'fullName bio priceRange ratingAverage',
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
  const coach = await ServiceProvider.findById(req.params.id)
    .populate('userId')
    .populate('reviews');

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
  }).select('fullName bio priceRange ratingAverage');

  res.status(200).json({
    status: 'success',
    results: Nutritionists.length,
    data: {
      Nutritionists,
    },
  });
});

exports.getNutritionistById = catchAsync(async (req, res, next) => {
  const Nutritionist = await ServiceProvider.findById(req.params.id)
    .populate('userId')
    .populate('reviews');

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
  }).select('fullName bio priceRange ratingAverage');

  res.status(200).json({
    status: 'success',
    results: PhysicalTherapists.length,
    data: {
      PhysicalTherapists,
    },
  });
});

exports.getPhysicalTherapyById = catchAsync(async (req, res, next) => {
  const PhysicalTherapy = await ServiceProvider.findById(req.params.id)
    .populate('userId')
    .populate('reviews');

  res.status(200).json({
    status: 'success',
    data: {
      PhysicalTherapy,
    },
  });
});

exports.updatedClient = catchAsync(async (req, res, next) => {
  const clientId = req.user.id;
  const updatedClient = await Client.findOneAndUpdate(
    { userId: clientId },
    req.body,
    { new: true },
  );

  await updatedClient.save();

  res.status(200).json({
    status: 'success',
    data: {
      updatedClient,
    },
  });
});

exports.updatedServiceProvider = catchAsync(async (req, res, next) => {
  const ServiceProviderId = req.user.id;
  const updatedServiceProvider = await ServiceProvider.findOneAndUpdate(
    { userId: ServiceProviderId },
    req.body,
    { new: true },
  );

  await updatedServiceProvider.save();

  res.status(200).json({
    status: 'success',
    data: {
      updatedServiceProvider,
    },
  });
});

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

exports.deleteClientAccount = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);
  await Client.findOneAndDelete({ userId: req.params.id });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.deleteServiceProviderAccount = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);
  await ServiceProvider.findOneAndDelete({ userId: req.params.id });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
