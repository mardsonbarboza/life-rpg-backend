import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Stats } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Stats | null> {
    return this.prisma.stats.findUnique({
      where: { userId },
    });
  }

  async updateStat(
    userId: string,
    statName: 'strength' | 'agility' | 'intelligence' | 'vitality',
    value: number,
  ): Promise<Stats> {
    const stats = await this.findByUserId(userId);

    if (!stats) {
      throw new NotFoundException('Stats não encontradas');
    }

    return this.prisma.stats.update({
      where: { userId },
      data: {
        [statName]: {
          increment: value,
        },
      },
    });
  }

  async increaseStatWithPoints(
    userId: string,
    statName: 'strength' | 'agility' | 'intelligence' | 'vitality',
    points: number,
  ): Promise<Stats> {
    const stats = await this.findByUserId(userId);

    if (!stats) {
      throw new NotFoundException('Stats não encontradas');
    }

    if (stats.availablePoints < points) {
      throw new BadRequestException('Pontos insuficientes');
    }

    return this.prisma.stats.update({
      where: { userId },
      data: {
        [statName]: {
          increment: points,
        },
        availablePoints: {
          decrement: points,
        },
      },
    });
  }

  async addAvailablePoints(userId: string, points: number): Promise<Stats> {
    return this.prisma.stats.update({
      where: { userId },
      data: {
        availablePoints: {
          increment: points,
        },
      },
    });
  }
}
