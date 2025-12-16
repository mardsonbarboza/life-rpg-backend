import { Module } from '@nestjs/common';
import { QuestsService } from './quests.service';
import { QuestsController } from './quests.controller';
import { UsersModule } from '../users/users.module';
import { StatsModule } from '../stats/stats.module';
import { AuthModule } from '../auth/auth.module'; // ← Adicione

@Module({
  imports: [UsersModule, StatsModule, AuthModule], // ← Adicione AuthModule
  providers: [QuestsService],
  controllers: [QuestsController],
})
export class QuestsModule {}