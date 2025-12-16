import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { AuthModule } from '../auth/auth.module'; // ← Adicione

@Module({
  imports: [AuthModule], // ← Adicione
  providers: [AchievementsService],
  controllers: [AchievementsController],
  exports: [AchievementsService],
})
export class AchievementsModule {}