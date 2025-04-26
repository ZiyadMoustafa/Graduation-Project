const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');

const communitySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'content is required'],
      trim: true,
      validate: {
        validator: function (el) {
          return validator.isLength(el, { min: 50, max: 500 });
        },
        message: 'content must be between 50 and 500 characters',
      },
    },
    img: { type: String, default: null },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'community must belong to a client'],
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        return _.omit(ret, ['__v']);
      },
    },
  },
);

communitySchema.pre(/^find/, function (next) {
  this.populate({
    path: 'clientId',
    select: 'fullName',
    model: 'client',
    foreignField: 'userId',
  });
  next();
});

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;
