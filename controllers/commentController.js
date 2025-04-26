const Comment = require('../models/commentModel');
const Community = require('../models/communityModel');
const catchAsync = require('../utils/catchAsync');
const Client = require('../models/clientModel');
const ServiceProvider = require('../models/serviceproviderModel');

exports.addComment = catchAsync(async (req, res, next) => {
  const { content } = req.body;
  const postId = req.params.id;
  const userId = req.user._id;
  const userType = req.user.role;

  let fullName;

  if (userType === 'client') {
    const client = await Client.findOne({ userId });
    fullName = client ? client.fullName : '';
  } else if (userType === 'serviceProvider') {
    const serviceProvider = await ServiceProvider.findOne({ userId });
    fullName = serviceProvider ? serviceProvider.fullName : '';
  }

  const newComment = await Comment.create({
    content,
    postId,
    userId,
    userType,
    fullName,
  });

  await Community.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

  res.status(201).json({
    status: 'success',
    message: 'Comment added successfully',
    data: { comment: newComment },
  });
});

exports.getComments = catchAsync(async (req, res, next) => {
  const postId = req.params.id;

  const comments = await Comment.find({ postId }).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: comments.length,
    data: { comments },
  });
});
