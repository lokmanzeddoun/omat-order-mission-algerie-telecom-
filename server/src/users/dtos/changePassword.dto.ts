import { IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { Match } from '../decorators/match.decorator';
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  //   @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
  //     message: 'password too weak',
  //   })
  password: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Match('password', {
      message:"confirmPassword Don't match the password"
  })
  passwordConfirm: string;
}
