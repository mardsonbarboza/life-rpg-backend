import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLog } from '@prisma/client';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateActivityLogDto): Promise<ActivityLog> {
    return this.prisma.activityLog.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findAllByUser(userId: string, limit = 50): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findRecent(userId: string, days = 7): Promise<ActivityLog[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    return this.prisma.activityLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: dateFrom,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByType(userId: string, type: string): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: {
        userId,
        type: type as any,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.activityLog.delete({
      where: { id },
    });
  }

  async deleteAll(userId: string): Promise<void> {
    await this.prisma.activityLog.deleteMany({
      where: { userId },
    });
  }

  async getStats(userId: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: { userId },
    });

    const stats = {
      total: logs.length,
      questsCompleted: logs.filter(l => l.type === 'QUEST_COMPLETED').length,
      questsFailed: logs.filter(l => l.type === 'QUEST_FAILED').length,
      levelUps: logs.filter(l => l.type === 'LEVEL_UP').length,
      achievementsUnlocked: logs.filter(l => l.type === 'ACHIEVEMENT_UNLOCKED').length,
      penaltiesApplied: logs.filter(l => l.type === 'PENALTY_APPLIED').length,
      statsIncreased: logs.filter(l => l.type === 'STAT_INCREASED').length,
    };

    return stats;
  }
}