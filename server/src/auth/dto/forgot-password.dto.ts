import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email of the account to reset', type: 'string' })
  @IsEmail()
  @MaxLength(254)
  email: string;
}
