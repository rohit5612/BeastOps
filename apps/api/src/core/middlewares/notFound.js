export function notFoundMiddleware(req, res, next) {
  if (res.headersSent) {
    return next();
  }

  return res.status(404).json({
    error: 'NotFound',
    message: 'Route not found',
  });
}

