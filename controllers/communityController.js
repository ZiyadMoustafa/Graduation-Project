const sharp = require('sharp');
const multer = require('multer');
const catchAsync = require('../utils/catchAsync');
const Community = require('../models/communityModel');
const AppError = require('../utils/appError');
const cloud = require('../utils/cloud');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Only images are allowed!', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadPhoto = upload.single('img');

const uploadToCloudinary = (buffer, filename, folderPath) =>
  new Promise((resolve, reject) => {
    cloud.uploader
      .upload_stream(
        {
          folder: folderPath,
          public_id: filename,
          format: 'jpeg',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      )
      .end(buffer);
  });

exports.resizePhotoAndUpload = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const imageBuffer = await sharp(req.file.buffer)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();

  const folderPath = 'Graduation/Community';
  const fileName = req.file.originalname;

  const result = await uploadToCloudinary(imageBuffer, fileName, folderPath);

  req.body.img = result.secure_url;
  next();
});

exports.createCommunity = async (req, res, next) => {
  try {
    const { content, img } = req.body;
    const clientId = req.user._id;

    const newCommunity = await Community.create({
      content,
      img,
      clientId,
    });

    res.status(201).json({
      status: 'success',
      data: { newCommunity },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllCommunities = catchAsync(async (req, res, next) => {
  const communities = await Community.find().sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: communities.length,
    data: { communities },
  });
});
