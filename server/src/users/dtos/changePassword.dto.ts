import { IsString, MaxLength } from 'class-validator';
import { Match } from '../decorators/match.decorator';
import {
  IsAcceptablePassword,
  PASSWORD_MAX,
} from 'src/common/validators/password';

export class ChangePasswordDto {
  @IsString()
  @MaxLength(PASSWORD_MAX)
  currentPassword: string;

  @IsAcceptablePassword()
  password: string;

  @IsString()
  @Match('password', {
    message: 'La confirmation ne correspond pas au mot de passe',
  })
  passwordConfirm: string;
}
