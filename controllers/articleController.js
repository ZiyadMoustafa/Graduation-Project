const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const cloud = require('../utils/cloud');
const Article = require('../models/articleModel');

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

  const folderPath = 'Graduation/Articles';

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

// Get all articles
exports.getAllArticles = catchAsync(async (req, res, next) => {
  let mongooseQuery;

  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    mongooseQuery = Article.find().select(fields);
  } else {
    mongooseQuery = Article.find();
  }

  const articles = await mongooseQuery;

  res.status(200).json({
    status: 'success',
    results: articles.length,
    articles,
  });
});

// Get a single article
exports.getArticle = catchAsync(async (req, res, next) => {
  const article = await Article.findById(req.params.id);

  if (!article) return next(new AppError('No article found with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: { article },
  });
});

// add article
exports.addArticle = catchAsync(async (req, res, next) => {
  const newArticle = await Article.create({
    ...req.body,
    serviceproviderId: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    data: { article: newArticle },
  });
});
