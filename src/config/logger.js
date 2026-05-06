const pino = require('pino');
const { LOG_LEVEL } = require('./env');

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: LOG_LEVEL,
  ...(isProduction
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true } } }),
});

module.exports = logger;
