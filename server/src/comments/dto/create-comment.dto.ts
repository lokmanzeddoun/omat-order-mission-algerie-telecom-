import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
} from 'class-validator';
import { MessageType } from '@prisma/client';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  // Validated against the enum so an arbitrary string can't be stored.
  @IsEnum(MessageType)
  type: MessageType;

  @IsInt()
  @IsOptional()
  decompteId?: number | null;

  // Accepted for backward compatibility but IGNORED by the service: authorship
  // comes from the authenticated token and status is always server-set. Kept in
  // the DTO only so an older client sending them is not rejected by the
  // whitelist (forbidNonWhitelisted).
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsInt()
  @IsOptional()
  userId?: number;
}
