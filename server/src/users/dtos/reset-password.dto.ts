import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsAcceptablePassword } from 'src/common/validators/password';

export class ResetPasswordDto {
  @ApiProperty({
    description:
      'Temporary password chosen by the admin. Omit it to have one generated; ' +
      'either way the user must change it at next sign-in.',
    required: false,
    minLength: 12,
  })
  @IsOptional()
  @IsAcceptablePassword()
  newPassword?: string;
}
