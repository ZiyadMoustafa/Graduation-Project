const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRoutes = require('./routes/userRoutes');
const articleRoutes = require('./routes/articleRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { webhookCheckout } = require('./controllers/bookingController');
const communityRoutes = require('./routes/communityRoutes');

const app = express();

// 1) MIDDLEWARES
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);

// Set security HTTP headers
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout,
);

// Putting all data in the body into request obj to read it
app.use(express.json());

// Data sanitization against NoSQL query injection comments
app.use(mongoSanitize());

// Data sanitization against xss
app.use(xss());

// 3) ROUTES
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/community', communityRoutes);

// Handler for Unhandled Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
