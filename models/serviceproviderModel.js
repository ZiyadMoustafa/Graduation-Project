const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');

const serviceProviderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Please enter your full name'],
      trim: true,
    },
    username: { type: String },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      validate: {
        validator: function (el) {
          return validator.isMobilePhone(el, 'ar-EG'); // "ar-EG" ensures only Egyptian numbers are allowed
        },
        message: 'Invalid Egyptian phone number format',
      },
    },
    job: {
      type: String,
      required: [true, 'Your job is required'],
      enum: ['Work Out', 'Nutirion', 'Physical Therapy'],
    },
    gender: {
      type: String,
      required: [true, 'Choose your gender'],
      enum: ['male', 'female'],
    },
    age: {
      type: String,
      required: [true, 'Enter Your Age'],
    },
    yearsOfExperience: {
      type: String,
      required: [true, 'This field is required'],
    },
    jobTitle: {
      type: String,
      required: [true, 'Your job Title is important'],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'Your BIO is important'],
      trim: true,
    },
    identifier: {
      type: String,
      required: [true, 'Your Certificate or Medical license is important'],
    },
    priceRange: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      default: 'service_provider',
    },
  },
  {
    toJSON: {
      transform: function (obj, retObj) {
        return _.omit(retObj, ['__v']);
      },
    },
  },
);

serviceProviderSchema.pre('save', function (next) {
  this.username = this.fullName.split(' ')[0];
  next();
});

const ServiceProvider = mongoose.model(
  'ServiceProviders',
  serviceProviderSchema,
);

module.exports = ServiceProvider;
