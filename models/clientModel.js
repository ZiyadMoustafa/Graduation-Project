const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const clientSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please enter your full name'],
    trim: true,
  },
  username: {
    type: String,
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
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
  password: {
    type: String,
    required: [true, 'fill password field'],
    minlength: [8, 'Password must be above 8 characters'],
    maxlength: [20, 'Password must be below 20 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'fill passwordConfirm field'],
    validate: {
      validator: function (el) {
        return el === this.password; // --> return false or true
      },
      message: 'Passwords are not the same',
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

// hashing password before stored in database
clientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
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

// compare between passwords in login
clientSchema.methods.correctPassword = async function (
  bodyPassword,
  userPassword,
) {
  return await bcrypt.compare(bodyPassword, userPassword);
};

const Client = mongoose.model('client', clientSchema);

module.exports = Client;
