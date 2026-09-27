import { IsEmail, IsString, MaxLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
export class loginUserDto {
  @ApiProperty({
    description: 'User email',
    type: 'string',
    example: 'ghomariWgmail.com',
  })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    description: 'User password',
    type: 'string',
    example: '******',
  })
  @IsString()
  @MaxLength(128)
  password: string;
}
