const sharp = require('sharp');
const multer = require('multer');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const cloud = require('../utils/cloud');
const Article = require('../models/articleModel');

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

  const folderPath = 'Graduation/Articles';
  const fileName = req.file.originalname;

  const result = await uploadToCloudinary(imageBuffer, fileName, folderPath);

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
