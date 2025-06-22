/* eslint-disable no-use-before-define */
// controllers/googleFitController.js
const { google } = require('googleapis');
const FitData = require('../models/fitDateModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI,
);

const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
];

exports.getAuthURL = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    redirect_uri: process.env.REDIRECT_URI,
  });

  res.status(200).json({
    status: 'success',
    url: authUrl,
  });
};

exports.oauth2callback = catchAsync(async (req, res, next) => {
  const { code } = req.query;

  if (!code) return next(new AppError('Authorization code not found', 400));

  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: process.env.REDIRECT_URI,
  });
  oauth2Client.setCredentials(tokens);

  const userId = req.user.id;

  let fitData = await FitData.findOne({ user: userId });
  if (!fitData) fitData = new FitData({ user: userId });

  fitData.refreshToken = tokens.refresh_token || fitData.refreshToken;

  const fetchedData = await fetchGoogleFitData(oauth2Client);

  fitData.steps = fetchedData.steps;
  fitData.heartRate = fetchedData.heartRate;
  fitData.calories = fetchedData.calories;
  fitData.sleep = fetchedData.sleep;

  await fitData.save();

  res.status(200).json({
    status: 'success',
    message: 'User connected and data fetched',
    data: fetchedData,
  });
});

exports.getUserFitData = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const fitData = await FitData.findOne({ user: userId });
  if (!fitData || !fitData.refreshToken)
    return next(new AppError('User not linked with Google Fit', 400));

  oauth2Client.setCredentials({ refresh_token: fitData.refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  oauth2Client.setCredentials(credentials);

  // eslint-disable-next-line no-use-before-define
  const fetchedData = await fetchGoogleFitData(oauth2Client);
  fitData.steps = fetchedData.steps;
  fitData.heartRate = fetchedData.heartRate;
  fitData.calories = fetchedData.calories;
  fitData.sleep = fetchedData.sleep;
  await fitData.save();

  res.status(200).json({
    status: 'success',
    data: fetchedData,
  });
});

async function fetchGoogleFitData(auth) {
  const fitness = google.fitness({ version: 'v1', auth });
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const aggregateRequest = async (dataType) => {
    const res = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy: [{ dataTypeName: dataType }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: oneDayAgo,
        endTimeMillis: now,
      },
    });
    return res.data.bucket.flatMap((bucket) =>
      bucket.dataset.flatMap((d) => d.point),
    );
  };

  return {
    steps: await aggregateRequest('com.google.step_count.delta'),
    heartRate: await aggregateRequest('com.google.heart_rate.bpm'),
    calories: await aggregateRequest('com.google.calories.expended'),
    sleep: await aggregateRequest('com.google.sleep.segment'),
  };
}

exports.getMyFitnessData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fitData = await FitData.findOne({ user: userId });

    if (!fitData) {
      return res.status(404).json({
        status: 'fail',
        message: 'No fitness data found for this user',
      });
    }

    res.status(200).json({
      status: 'success',
      data: fitData,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while fetching data',
    });
  }
};

exports.refreshAndGetData = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const fitData = await FitData.findOne({ user: userId });

  if (!fitData || !fitData.refreshToken)
    return next(new AppError('User not linked with Google Fit', 400));

  oauth2Client.setCredentials({ refresh_token: fitData.refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();
  oauth2Client.setCredentials(credentials);

  const fetchedData = await fetchGoogleFitData(oauth2Client);

  fitData.steps = fetchedData.steps;
  fitData.heartRate = fetchedData.heartRate;
  fitData.calories = fetchedData.calories;
  fitData.sleep = fetchedData.sleep;

  await fitData.save();

  res.status(200).json({
    status: 'success',
    message: 'Data refreshed and saved successfully',
    data: fetchedData,
  });
});
