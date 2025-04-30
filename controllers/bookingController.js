const stripe = require('stripe')(process.env.STRIPE_SECRET);
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const Booking = require('../models/bookingModel');
const Message = require('../models/messageModel');
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

  if (event.type === 'checkout.session.completed') {
    session = event.data.object;

    const { duration, goal, platformFee, providerId, servicerProviderIncome } =
      session.metadata;

    const totalPrice = session.amount_total / 100;

    try {
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
    } catch (err) {
      return next(new AppError(err, 400));
    }
  }
});

exports.getMyNewBookings = catchAsync(async (req, res, next) => {
  const provider = await Booking.find({
    serviceProvider: req.user._id,
    status: 'pending',
  })
    .populate({
      path: 'client',
      model: 'client',
      foreignField: 'userId',
      select: 'fullName age weight height',
    })
    .select('goal duration totalPrice')
    .sort({ paidAt: -1 });

  res.status(200).json({
    status: 'success',
    results: provider.length,
    data: provider,
  });
});

exports.getAllBookings = catchAsync(async (req, res, next) => {
  const allBookings = await Booking.find()
    .populate({
      path: 'client',
      model: 'client',
      foreignField: 'userId',
      select: 'fullName',
    })
    .populate({
      path: 'serviceProvider',
      model: 'ServiceProviders',
      foreignField: 'userId',
      select: 'fullName job priceRange ratingAverage',
    })
    .sort({ paidAt: -1 });

  res.status(200).json({
    status: 'success',
    results: allBookings.length,
    data: allBookings,
  });
});

exports.respondOfBooking = catchAsync(async (req, res, next) => {
  const bookingId = req.params.bookingId;
  const status = req.body.status;

  // 1) Get booking by id
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return next(new AppError('Booking not found', 404));

  // 2) Update status
  booking.status = status;
  await booking.save();

  // 3) Check if status is accept or reject
  if (status === 'accept') {
    const systemMessage = `أهلاً وسهلاً بيكم في تطبيق Nezamk ✨\nملحوظة هامة: يُرجى التواصل من خلال الشات لضمان حقوق الطرفين.`;

    await Message.create([
      {
        bookingId: booking._id,
        senderId: booking.client._id,
        receiverId: booking.serviceProvider._id,
        senderType: 'system',
        text: systemMessage,
        createdAt: new Date(),
      },
      {
        bookingId: booking._id,
        senderId: booking.serviceProvider._id,
        receiverId: booking.client._id,
        senderType: 'system',
        text: systemMessage,
        createdAt: new Date(),
      },
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Booking accepted. Chat is now available.',
      systemMessage,
    });
  } else if (status === 'reject') {
    // Refund money to client
    try {
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
      });

      booking.isPaid = false;
      booking.paidAt = null;

      await booking.save();

      return res.status(200).json({
        status: 'success',
        message: 'Booking rejected and payment refunded.',
        refund,
      });
    } catch (err) {
      return next(new AppError('Failed to refund payment', 500));
    }
  }
});

exports.getAcceptedBookingsForClient = catchAsync(async (req, res, next) => {
  const acceptedBookings = await Booking.find({
    client: req.user._id,
    status: 'accept',
  })
    .populate({
      path: 'serviceProvider',
      model: 'ServiceProviders',
      foreignField: 'userId',
      select: 'fullName jobTitle',
    })
    .sort({ paidAt: -1 });

  res.status(200).json({
    status: 'success',
    results: acceptedBookings.length,
    data: acceptedBookings,
  });
});

exports.getAcceptedBookingsForServiceProvider = catchAsync(
  async (req, res, next) => {
    const acceptedBookings = await Booking.find({
      serviceProvider: req.user._id,
      status: 'accept',
    })
      .populate({
        path: 'client',
        model: 'client',
        foreignField: 'userId',
        select: 'fullName',
      })
      .sort({ paidAt: -1 });

    res.status(200).json({
      status: 'success',
      results: acceptedBookings.length,
      data: acceptedBookings,
    });
  },
);

exports.getChatMessages = catchAsync(async (req, res, next) => {
  const { bookingId } = req.params;

  const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: messages,
  });
});
