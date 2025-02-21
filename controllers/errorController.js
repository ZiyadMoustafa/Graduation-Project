const sendErrorDev = (err, res) => {
  // send information about error as many details as possible
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // operational error : send message to client tell him what error .. like (user try to access route doesn't exist or input invalid data)
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    // programming or other unkown errors : don't tell error details
  } else {
    // 1) LOG ERROR
    console.error('Error Happened', err);

    // 2) Send Generic Message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'fail';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(err, res);
  }
};
