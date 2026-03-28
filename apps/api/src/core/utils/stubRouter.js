import expressPromiseRouter from 'express-promise-router';

/**
 * @param {string} moduleName Human-readable name for 501 responses
 */
export function createStubRouter(moduleName) {
  const router = expressPromiseRouter();

  router.all('*', (req, res) => {
    res.status(501).json({
      error: 'NotImplemented',
      module: moduleName,
      message: `${moduleName} API is not implemented yet`,
      path: req.originalUrl,
      method: req.method,
    });
  });

  return router;
}
