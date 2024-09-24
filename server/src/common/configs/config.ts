import type { Config } from './config.interface';

const config: Config = {
  nest: {
    port: 8000,
  },
  cors: {
    enabled: true,
  },
  swagger: {
    enabled: true,
    title: 'OMAT API',
    description: 'The OMAT API For Order Mission',
    version: '1.0',
    path: 'api',
  },
  security: {
    expiresIn: '60m',
    refreshIn: '7d',
    bcryptSaltOrRound: 10,
  },
};

export default (): Config => config;
