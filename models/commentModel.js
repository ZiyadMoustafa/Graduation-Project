const mongoose = require('mongoose');
const _ = require('lodash');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      minlength: [1, 'Comment must have at least 1 character'],
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: [true, 'Post ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'User ID is required'],
    },
    userType: {
      type: String,
      enum: ['client', 'serviceProvider'],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
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

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
