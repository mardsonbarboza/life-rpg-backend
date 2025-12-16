import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Quest, QuestStatus, ActivityType } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { StatsService } from '../stats/stats.service';
import { CreateQuestDto } from './dto/create-quest.dto';
import { UpdateQuestProgressDto } from './dto/update-quest-progress.dto';

@Injectable()
export class QuestsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private statsService: StatsService,
  ) {}

  async create(userId: string, data: CreateQuestDto): Promise<Quest> {
    return await this.prisma.quest.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findAllByUser(userId: string): Promise<Quest[]> {
    return this.prisma.quest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Quest> {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!quest) {
      throw new NotFoundException('Quest não encontrada');
    }

    return quest;
  }

  async updateProgress(
    id: string,
    dto: UpdateQuestProgressDto,
  ): Promise<Quest> {
    const quest = await this.findOne(id);

    const newProgress = quest.currentProgress + dto.progress;
    const isCompleted = newProgress >= quest.targetProgress;

    const updatedQuest = await this.prisma.quest.update({
      where: { id },
      data: {
        currentProgress: Math.min(newProgress, quest.targetProgress),
        status: isCompleted ? QuestStatus.COMPLETED : QuestStatus.IN_PROGRESS,
      },
    });

    if (isCompleted) {
      await this.giveRewards(updatedQuest);
    }

    return updatedQuest;
  }

  async completeQuest(id: string): Promise<Quest> {
    const quest = await this.findOne(id);

    const completedQuest = await this.prisma.quest.update({
      where: { id },
      data: {
        currentProgress: quest.targetProgress,
        status: QuestStatus.COMPLETED,
      },
    });

    await this.giveRewards(completedQuest);

    return completedQuest;
  }

  async applyPenalty(id: string): Promise<Quest> {
    const quest = await this.findOne(id);
    const userId = quest.userId;

    if (quest.hpPenalty > 0) {
      await this.usersService.updateHp(userId, -quest.hpPenalty);
    }

    if (quest.statPenalty > 0 && quest.statPenaltyType) {
      await this.statsService.updateStat(
        userId,
        quest.statPenaltyType.toLowerCase() as any,
        -quest.statPenalty,
      );
    }

    await this.prisma.activityLog.create({
      data: {
        userId,
        type: ActivityType.PENALTY_APPLIED,
        message: `Penalidade aplicada: "${quest.title}" - Você perdeu ${quest.hpPenalty} HP${quest.statPenalty ? ` e ${quest.statPenalty} ${quest.statPenaltyType}` : ''}`,
        icon: '⚠️',
        metadata: {
          questId: quest.id,
          questTitle: quest.title,
        },
      },
    });

    return quest;
  }

  private async giveRewards(quest: Quest) {
    const userId = quest.userId;

    if (quest.goldReward > 0) {
      await this.usersService.addGold(userId, quest.goldReward);
    }

    if (quest.xpReward > 0) {
      await this.usersService.addXp(userId, quest.xpReward);
    }

    if (quest.statReward) {
      const [stat, value] = quest.statReward.split(':');
      await this.statsService.updateStat(
        userId,
        stat.toLowerCase() as any,
        parseInt(value),
      );
    }

    await this.usersService.incrementStreak(userId);

    await this.prisma.activityLog.create({
      data: {
        userId,
        type: ActivityType.QUEST_COMPLETED,
        message: `Quest "${quest.title}" completada! +${quest.goldReward} Gold, +${quest.xpReward} XP${quest.statReward ? `, +${quest.statReward}` : ''}`,
        icon: '✅',
        metadata: {
          questId: quest.id,
          questTitle: quest.title,
          rewards: {
            gold: quest.goldReward,
            xp: quest.xpReward,
            stat: quest.statReward,
          },
        },
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyQuests() {
    const dailyQuests = await this.prisma.quest.findMany({
      where: { isDaily: true },
    });

    for (const quest of dailyQuests) {
      if (quest.status === QuestStatus.COMPLETED && quest.isRecurring) {
        await this.prisma.quest.update({
          where: { id: quest.id },
          data: {
            currentProgress: 0,
            status: QuestStatus.AVAILABLE,
          },
        });
      } else if (quest.status !== QuestStatus.COMPLETED) {
        await this.prisma.quest.update({
          where: { id: quest.id },
          data: {
            status: QuestStatus.FAILED,
          },
        });

        await this.prisma.activityLog.create({
          data: {
            userId: quest.userId,
            type: ActivityType.QUEST_FAILED,
            message: `Quest "${quest.title}" falhou (tempo expirado)`,
            icon: '❌',
            metadata: {
              questId: quest.id,
              questTitle: quest.title,
            },
          },
        });
      }
    }

    console.log('✅ Daily quests reset completed');
  }

  async delete(id: string): Promise<void> {
    await this.prisma.quest.delete({
      where: { id },
    });
  }
}
