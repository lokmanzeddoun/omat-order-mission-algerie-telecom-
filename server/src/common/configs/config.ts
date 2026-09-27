import type { Config } from './config.interface';

const config: Config = {
  nest: {
    port: parseInt(process.env.PORT ?? '8000', 10),
  },
  cors: {
    enabled: true,
  },
  swagger: {
    enabled: true,
    title: 'OMAT API',
    description: 'The OMAT API For Order Mission',
    version: '1.0',
    path: 'docs',
  },
  security: {
    expiresIn: '60m',
    refreshIn: '7d',
    bcryptSaltOrRound: 10,
  },
};

export default (): Config => config;
