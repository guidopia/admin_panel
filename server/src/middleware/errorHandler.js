import mongoose from 'mongoose';

export function errorHandler(err, _req, res, _next) {
  const statusCode = Number(err.statusCode || 500);
  const message = err.message || 'Server error';

  const payload = {
    message,
  };

  if (err.details) payload.details = err.details;

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: 'Validation error',
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  return res.status(statusCode).json(payload);
}

