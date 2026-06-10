import pino from 'pino';
import { env } from '../config/env';

const loggerOptions: pino.LoggerOptions = {
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  base: {
    service: 'xeno-crm',
  },
};

if (env.NODE_ENV !== 'production') {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(loggerOptions);

export default logger;
