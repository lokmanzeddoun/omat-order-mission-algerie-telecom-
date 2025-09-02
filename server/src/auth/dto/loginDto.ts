import { IsEmail, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
export class loginUserDto {
  @ApiProperty({
    description: 'User email',
    type: 'string',
    example: 'ghomariWgmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    type: 'string',
    example: '******',
  })
  @IsString()
  password: string;
}
