const stripe = require('stripe')(process.env.STRIPE_SECRET);
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const Booking = require('../models/bookingModel');
const Client = require('../models/clientModel');
const ServiceProvider = require('../models/serviceproviderModel');
const User = require('../models/userModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // Check if service provider is exist or not
  const provider = await ServiceProvider.find({
    userId: req.params.serviceproviderID,
  });
  if (!provider) {
    return next(new AppError('Service provider not found', 404));
  }

  const { goal, duration, price } = req.body;

  const totalPrice = price;
  const platformFee = totalPrice * 0.15;
  const servicerProviderIncome = totalPrice - platformFee;

  const client = await Client.findOne({ userId: req.user._id });
  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'egp',
          unit_amount: totalPrice * 100,
          product_data: {
            name: client.fullName,
            description: 'HealthMate Booking Payment',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/bookings`,
    cancel_url: `${req.protocol}://${req.get('host')}/bookings`,
    customer_email: req.user.email,
    client_reference_id: req.user._id.toString(),
    metadata: {
      providerId: req.params.serviceproviderID,
      goal,
      duration,
      platformFee,
      servicerProviderIncome,
    },
  });

  // 3) Send session to response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let session;
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') session = event.data.object;

  const { duration, goal, platformFee, providerId, servicerProviderIncome } =
    session.metadata;

  const totalPrice = session.amount_total / 100;

  await Booking.create({
    client: session.client_reference_id,
    serviceProvider: providerId,
    goal,
    duration,
    totalPrice,
    platformFee,
    servicerProviderIncome,
    isPaid: true,
    paidAt: Date.now(),
    paymentIntentId: session.payment_intent,
  });

  res.status(200).json({ received: true });
});
