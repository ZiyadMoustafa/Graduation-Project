const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const catchAsync = require('../utils/catchAsync');
const Community = require('../models/communityModel');
const AppError = require('../utils/appError');
const cloud = require('../utils/cloud');

const multerStorage = multer.memoryStorage();

// File filter to allow only images
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Only images are allowed!', 404), false);
  }
};

// Multer configuration
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
});

exports.uploadPhoto = upload.single('img');

const uploadToCloudinary = (buffer, filename, folderPath) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloud.uploader.upload_stream(
      {
        folder: folderPath,
        public_id: filename,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );
    uploadStream.end(buffer);
  });

// Middleware to Process and Upload Image to Cloudinary
exports.resizePhotoAndUpload = catchAsync(async (req, res, next) => {
  const { fileTypeFromBuffer } = await import('file-type');

  if (!req.file) return next();

  const folderPath = 'Graduation/Community';

  const fileType = await fileTypeFromBuffer(req.file.buffer);
  if (!fileType || !['image/jpeg', 'image/png'].includes(fileType.mime)) {
    throw new AppError('نوع الصورة غير مدعوم', 400);
  }

  // Resize with sharp
  const imageBuffer = await sharp(req.file.buffer)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();

  const uniqueFileName = uuidv4();

  const result = await uploadToCloudinary(
    imageBuffer,
    uniqueFileName,
    folderPath,
  );

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
