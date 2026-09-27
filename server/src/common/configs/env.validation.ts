import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

const SECRET_HINT =
  "generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64'))\"";

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @MinLength(32, {
    message: `JWT_SECRET must be at least 32 characters; ${SECRET_HINT}`,
  })
  JWT_SECRET: string;

  @IsString()
  @MinLength(32, {
    message: `JWT_REFRESH_SECRET must be at least 32 characters and differ from JWT_SECRET; ${SECRET_HINT}`,
  })
  JWT_REFRESH_SECRET: string;

  @IsOptional()
  @Matches(/^\d+[smh]$/, {
    message: 'JWT_EXPIRES_IN must look like 15m (seconds, minutes or hours)',
  })
  JWT_EXPIRES_IN?: string;

  /** Key for the TOTP secrets stored in the database (AES-256-GCM). */
  @IsString()
  @MinLength(32, {
    message: `MFA_ENCRYPTION_KEY must be at least 32 characters; ${SECRET_HINT}`,
  })
  MFA_ENCRYPTION_KEY: string;

  /** ADMIN / SUPER_ADMIN must pass TOTP MFA. Only development may turn it off. */
  @IsOptional()
  @IsIn(['true', 'false'])
  AUTH_MFA_REQUIRED?: string;

  /** Login / MFA attempts per minute per IP and account (default 5). */
  @IsOptional()
  @IsInt()
  @Min(1)
  AUTH_RATE_LIMIT?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  /** Required in production: the QR codes and the Origin check depend on it. */
  @ValidateIf((env) => env.NODE_ENV === 'production' || !!env.APP_PUBLIC_URL)
  @IsUrl({
    require_tld: false,
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  APP_PUBLIC_URL?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  /** Express `trust proxy`: a hop count, or loopback/linklocal/uniquelocal/an IP list. */
  @IsOptional()
  @Matches(/^(\d+|false|loopback|linklocal|uniquelocal|[0-9a-fA-F.:/, ]+)$/)
  TRUST_PROXY?: string;

  @IsOptional()
  @IsIn(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
  LOG_LEVEL?: string;
}

/** ConfigModule `validate`: the app refuses to boot on a bad environment. */
export function validateEnv(raw: Record<string, unknown>) {
  const env = plainToInstance(EnvironmentVariables, raw, {
    enableImplicitConversion: true,
  });
  const problems = validateSync(env, { skipMissingProperties: false }).flatMap(
    (e) => Object.values(e.constraints ?? {}),
  );
  if (env.JWT_SECRET && env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    problems.push('JWT_REFRESH_SECRET must differ from JWT_SECRET.');
  }
  if (env.MFA_ENCRYPTION_KEY && env.MFA_ENCRYPTION_KEY === env.JWT_SECRET) {
    problems.push('MFA_ENCRYPTION_KEY must differ from JWT_SECRET.');
  }
  if (env.NODE_ENV !== 'development' && env.AUTH_MFA_REQUIRED === 'false') {
    problems.push('AUTH_MFA_REQUIRED=false is only allowed in development.');
  }
  if (problems.length) {
    throw new Error(`Invalid environment:\n - ${problems.join('\n - ')}`);
  }
  return { ...raw, ...env };
}
