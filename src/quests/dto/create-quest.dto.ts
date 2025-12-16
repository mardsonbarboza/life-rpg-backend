import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestDifficulty, QuestType } from '@prisma/client';

export class CreateQuestDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(QuestDifficulty)
  difficulty: QuestDifficulty;

  @IsEnum(QuestType)
  @IsOptional()
  type?: QuestType;

  @IsNumber()
  targetProgress: number;

  @IsString()
  unit: string;

  @IsNumber()
  @IsOptional()
  goldReward?: number;

  @IsNumber()
  @IsOptional()
  xpReward?: number;

  @IsString()
  @IsOptional()
  statReward?: string;

  @IsNumber()
  @IsOptional()
  hpPenalty?: number;

  @IsNumber()
  @IsOptional()
  statPenalty?: number;

  @IsString()
  @IsOptional()
  statPenaltyType?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  deadline?: Date;

  @IsBoolean()
  @IsOptional()
  isDaily?: boolean;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;
}
