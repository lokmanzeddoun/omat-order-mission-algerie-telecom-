import { IsJWT, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaSetupDto {
  @ApiProperty({
    description: 'Token returned by /auth/login (stage "enroll")',
  })
  @IsJWT()
  mfaToken: string;
}

export class MfaVerifyDto extends MfaSetupDto {
  @ApiProperty({
    description: '6-digit TOTP code, or a recovery code (xxxxx-xxxxx)',
  })
  @IsString()
  @Matches(/^(\d{3}\s?\d{3}|[0-9a-fA-F]{5}-?[0-9a-fA-F]{5})$/, {
    message: 'Code invalide',
  })
  code: string;
}
