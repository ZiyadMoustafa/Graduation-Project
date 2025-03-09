const mongoose = require('mongoose');
const validator = require('validator');

const clientSchema = new mongoose.Schema({
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
  gender: {
    type: String,
    required: [true, 'Choose your gender'],
    enum: ['male', 'female'],
  },
  age: {
    type: String,
    required: [true, 'Enter Your Age'],
  },
  weight: {
    type: String,
    required: [true, 'Enter Your Weight'],
  },
  height: {
    type: String,
    required: [true, 'Enter Your Height'],
  },
  goal: {
    type: String,
    required: [true, 'Choose Your Goal'],
  },
  physicalActivityLevel: {
    type: String,
    required: [true, 'Choose Your Physical Activity Level'],
    enum: ['Beginner', 'Intermediate', 'Advance'],
  },
  role: {
    type: String,
    default: 'client',
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
// create username
clientSchema.pre('save', function (next) {
  this.username = this.fullName.split(' ')[0];
  next();
});

clientSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
const Client = mongoose.model('client', clientSchema);

module.exports = Client;
