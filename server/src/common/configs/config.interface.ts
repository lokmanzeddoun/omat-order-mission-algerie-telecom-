export interface Config {
  nest: NestConfig;
  cors: CorsConfig;
  swagger: SwaggerConfig;
  security: SecurityConfig;
  auth: AuthConfig;
}

export interface AuthConfig {
  /** Access-token lifetime, e.g. '15m'. */
  accessTtl: string;
  /** Refresh-session lifetime, in milliseconds. */
  refreshTtlMs: number;
  /** Browser path the refresh cookie is sent to (the API is behind /api). */
  refreshCookiePath: string;
  secureCookies: boolean;
  mfaRequired: boolean;
  /** Origins allowed to call the cookie-authenticated auth routes. */
  allowedOrigins: string[];
  allowLocalhostOrigins: boolean;
}

export interface NestConfig {
  port: number;
  trustProxy: boolean | number | string;
}

export interface CorsConfig {
  enabled: boolean;
  origins: string[];
}

export interface SwaggerConfig {
  enabled: boolean;
  title: string;
  description: string;
  version: string;
  path: string;
}

export interface SecurityConfig {
  expiresIn: string;
  refreshIn: string;
  bcryptSaltOrRound: string | number;
}
