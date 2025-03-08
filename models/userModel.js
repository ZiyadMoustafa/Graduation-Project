const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, 'Please enter a valid email'],
    unique: true,
    trim: true,
    lowercase: true,
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
  role: {
    type: String,
    enum: ['client', 'service_provider'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetCode: String,
  passwordResetExpires: Date,
  passwordResetVerified: Boolean,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.methods.correctPassword = async function (
  bodyPassword,
  userPassword,
) {
  return await bcrypt.compare(bodyPassword, userPassword);
};

userSchema.methods.createPasswordResetCode = function () {
  const resetCode = Math.floor(10000 + Math.random() * 90000).toString(); // => use this token to create a new password

  this.passwordResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  this.passwordResetVerified = false;

  return resetCode;
};

// main collection for all users
const User = mongoose.model('User', userSchema);
module.exports = User;
