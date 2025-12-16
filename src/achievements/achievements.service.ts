import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Achievement, ActivityType } from '@prisma/client';
import { CreateAchievementDto } from './dto/create-achievement.dto';

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateAchievementDto): Promise<Achievement> {
    return this.prisma.achievement.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findAllByUser(userId: string): Promise<Achievement[]> {
    return this.prisma.achievement.findMany({
      where: { userId },
      orderBy: [
        { unlocked: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findUnlocked(userId: string): Promise<Achievement[]> {
    return this.prisma.achievement.findMany({
      where: {
        userId,
        unlocked: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  async findLocked(userId: string): Promise<Achievement[]> {
    return this.prisma.achievement.findMany({
      where: {
        userId,
        unlocked: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async unlock(id: string): Promise<Achievement> {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!achievement) {
      throw new NotFoundException('Conquista não encontrada');
    }

    if (achievement.unlocked) {
      return achievement;
    }

    const unlockedAchievement = await this.prisma.achievement.update({
      where: { id },
      data: {
        unlocked: true,
        unlockedAt: new Date(),
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: achievement.userId,
        type: ActivityType.ACHIEVEMENT_UNLOCKED,
        message: `Conquista desbloqueada: "${achievement.name}"`,
        icon: '🏆',
        metadata: {
          achievementId: achievement.id,
          achievementName: achievement.name,
        },
      },
    });

    return unlockedAchievement;
  }

  async checkAchievements(userId: string): Promise<void> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      stats: true,
      quests: true,
      achievements: true,
    },
  });

  if (!user) return;

  const achievements = user.achievements;

  for (const achievement of achievements) {
    if (achievement.unlocked || !achievement.condition) continue;

    let shouldUnlock = false;

    switch (achievement.condition) {
      case 'complete_first_quest':
        const completedQuests = user.quests.filter(q => q.status === 'COMPLETED');
        shouldUnlock = completedQuests.length >= 1;
        break;

      case 'streak_7_days':
        shouldUnlock = user.streakDays >= 7;
        break;

      case 'strength_100':
        shouldUnlock = !!(user.stats && user.stats.strength >= 100);
        break;

      case 'agility_100':
        shouldUnlock = !!(user.stats && user.stats.agility >= 100);
        break;

      case 'intelligence_100':
        shouldUnlock = !!(user.stats && user.stats.intelligence >= 100);
        break;

      case 'vitality_100':
        shouldUnlock = !!(user.stats && user.stats.vitality >= 100);
        break;

      case 'level_10':
        shouldUnlock = user.level >= 10;
        break;

      case 'level_50':
        shouldUnlock = user.level >= 50;
        break;

      case 'gold_1000':
        shouldUnlock = user.gold >= 1000;
        break;

      case 'complete_10_quests':
        const completed = user.quests.filter(q => q.status === 'COMPLETED');
        shouldUnlock = completed.length >= 10;
        break;
    }

    if (shouldUnlock) {
      await this.unlock(achievement.id);
    }
  }
}
  async delete(id: string): Promise<void> {
    await this.prisma.achievement.delete({
      where: { id },
    });
  }
}