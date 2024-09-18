"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    nest: {
        port: 3000,
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
    graphql: {
        playgroundEnabled: true,
        debug: true,
        schemaDestination: './src/schema.graphql',
        sortSchema: true,
    },
    security: {
        expiresIn: '60m',
        refreshIn: '7d',
        bcryptSaltOrRound: 10,
    },
};
exports.default = () => config;
//# sourceMappingURL=config.js.map