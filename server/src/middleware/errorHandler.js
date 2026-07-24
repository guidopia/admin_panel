import mongoose from 'mongoose';

const isProd = () => process.env.NODE_ENV === 'production';

export function errorHandler(err, req, res, _next) {
  // Mongoose schema validation errors → 400 with field messages.
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: 'Validation error',
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Malformed ObjectId (e.g. an invalid ":id" route param) → 400, not 500.
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid ${err.path || 'identifier'}` });
  }

  // Duplicate key (unique index race) → 409 with the offending field(s).
  if (err && (err.code === 11000 || err.code === 11001)) {
    const fields = err.keyValue ? Object.keys(err.keyValue) : [];
    const label = fields.length ? fields.join(', ') : 'value';
    return res.status(409).json({ message: `Duplicate ${label}: already in use` });
  }

  let statusCode = Number(err.statusCode || 500);
  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  // Log unexpected server errors so production issues are traceable.
  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(
      `[error] ${req?.method || ''} ${req?.originalUrl || ''} ->`,
      err?.stack || err
    );
  }

  const payload = {
    // Never leak internal error details for unexpected 5xx in production.
    message:
      statusCode >= 500 && isProd() ? 'Server error' : err.message || 'Server error',
  };

  if (err.details) payload.details = err.details;
  if (!isProd()) payload.stack = err.stack;

  return res.status(statusCode).json(payload);
}

