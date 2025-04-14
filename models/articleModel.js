const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      validate: {
        validator: function (el) {
          return validator.isLength(el, { min: 5, max: 70 });
        },
        message: 'Title must be between 5 and 70 characters',
      },
    },
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
    img: { type: String, default: 'null' },
    serviceproviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'article must belong to a serviceprovider'],
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

articleSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'serviceproviderId',
    model: 'ServiceProviders',
    foreignField: 'userId',
    select: 'fullName',
  });
  next();
});
const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
