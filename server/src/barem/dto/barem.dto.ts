import { Category } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateBaremDto {
  @IsEnum(Category)
  libell!: Category;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  repas_nord!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hebergement_nord!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  repas_sud!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hebergement_sud!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montant_km!: number;
}

export class UpdateBaremDto {
  @IsOptional()
  @IsEnum(Category)
  libell?: Category;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  repas_nord?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hebergement_nord?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  repas_sud?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hebergement_sud?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montant_km?: number;
}
