import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityLogDto {
  @IsEnum(ActivityType)
  type: ActivityType;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}