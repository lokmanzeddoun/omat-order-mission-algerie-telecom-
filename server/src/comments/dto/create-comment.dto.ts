import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEmail,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string; // use MessageType enum values (FORGET_PASSWORD, DECOMPTE_STATUS, OTHER)

  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  decompteId?: number | null;

  @IsEmail()
  @IsOptional()
  // When the requester is not authenticated they can provide their email to link the comment to their account
  email?: string;

  @IsInt()
  @IsOptional()
  userId?: number;
}
