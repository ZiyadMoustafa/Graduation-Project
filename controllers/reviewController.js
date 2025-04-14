const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create a new review
exports.addReview = catchAsync(async (req, res, next) => {
  const { serviceprovider } = req.body;

  const existingReview = await Review.findOne({
    Client: req.user.id,
    serviceprovider: serviceprovider,
  });

  if (existingReview) {
    return next(
      new AppError('You have already reviewed this service provider', 400),
    );
  }

  const newReview = await Review.create({
    ...req.body,
    Client: req.user.id,
  });

  res.status(201).json({
    status: 'success',
    data: { review: newReview },
  });
});

// Get all reviews
exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

// Get a single review
exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { review },
  });
});
