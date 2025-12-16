import { IsNumber, Min } from 'class-validator';

export class UpdateQuestProgressDto {
  @IsNumber()
  @Min(0)
  progress: number;
}
