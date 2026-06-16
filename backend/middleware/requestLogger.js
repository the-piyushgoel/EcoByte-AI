const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const color =
      res.statusCode >= 500
        ? '\x1b[31m' // red
        : res.statusCode >= 400
        ? '\x1b[33m' // yellow
        : res.statusCode >= 300
        ? '\x1b[36m' // cyan
        : '\x1b[32m'; // green

    const reset = '\x1b[0m';
    console.log(
      `${color}[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)${reset}`
    );
  });

  next();
};

module.exports = requestLogger;
