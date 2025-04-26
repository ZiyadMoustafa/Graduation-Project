const Like = require('../models/likeModel');
const Community = require('../models/communityModel');
const catchAsync = require('../utils/catchAsync');

exports.Like = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const postId = req.params.id;

  const existingLike = await Like.findOne({ postId, userId });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });

    const updatedCommunity = await Community.findByIdAndUpdate(
      postId,
      {
        $inc: { likesCount: -1 },
      },
      { new: true },
    );

    return res.status(200).json({
      status: 'success',
      liked: false,
      message: 'Like removed',
      likesCount: updatedCommunity.likesCount,
    });
  }

  await Like.create({ postId, userId });

  const updatedCommunity = await Community.findByIdAndUpdate(
    postId,
    {
      $inc: { likesCount: 1 },
    },
    { new: true },
  );

  return res.status(200).json({
    status: 'success',
    liked: true,
    message: 'Post liked',
    likesCount: updatedCommunity.likesCount,
  });
});
