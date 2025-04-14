const mongoose = require('mongoose');
const _ = require('lodash');
const ServiceProvider = require('./serviceproviderModel');

const reviewSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: [true, 'Review can not be empty!'],
      trim: true,
      maxlength: [150, 'Review must have 150 characters or less.'],
      minlength: [20, 'Review must have at least 20 characters.'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      required: [true, 'Review must have a rating'],
      default: 0,
    },
    serviceprovider: {
      type: mongoose.Schema.ObjectId,
      ref: 'ServiceProviders',
      required: true,
    },
    Client: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'You are not logged in'],
    },
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        return _.omit(ret, ['__v']);
      },
    },
  },
);

reviewSchema.statics.calculateAverageRatings = async function (
  serviceproviderId,
) {
  const result = await this.aggregate([
    {
      $match: { serviceprovider: serviceproviderId },
    },
    {
      $group: {
        _id: '$serviceprovider',
        ratingQuantity: { $sum: 1 },
        ratingAverage: { $avg: '$rating' },
      },
    },
  ]);

  if (result.length > 0) {
    await ServiceProvider.findByIdAndUpdate(serviceproviderId, {
      ratingQuantity: result[0].ratingQuantity,
      ratingAverage: result[0].ratingAverage,
    });
  } else {
    await ServiceProvider.findByIdAndUpdate(serviceproviderId, {
      ratingQuantity: 0,
      ratingAverage: 0,
    });
  }
};

reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRatings(this.serviceprovider);
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'Client',
    model: 'client',
    foreignField: 'userId',
    select: 'fullName',
  });
  next();
});

reviewSchema.index({ serviceprovider: 1, Client: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
