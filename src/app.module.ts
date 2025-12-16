import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; // ← Adicione isso
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StatsModule } from './stats/stats.module';
import { QuestsModule } from './quests/quests.module';
import { AchievementsModule } from './achievements/achievements.module';
import { ActivityLogModule } from './activity-log/activity-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(), // ← Adicione isso
    PrismaModule,
    AuthModule,
    UsersModule,
    StatsModule,
    QuestsModule,
    AchievementsModule,
    ActivityLogModule,
  ],
})
export class AppModule {}
