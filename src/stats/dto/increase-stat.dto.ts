import { IsString, IsNumber, IsEnum, Min } from 'class-validator';

enum StatType {
  STRENGTH = 'strength',
  AGILITY = 'agility',
  INTELLIGENCE = 'intelligence',
  VITALITY = 'vitality',
}

export class IncreaseStatDto {
  @IsEnum(StatType)
  stat: StatType;

  @IsNumber()
  @Min(1)
  points: number;
}
