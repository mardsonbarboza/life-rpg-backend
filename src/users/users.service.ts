import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRank } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
      include: { stats: true },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { stats: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async addXp(userId: string, xp: number): Promise<User> {
    const user = await this.findById(userId);
    let currentXp = user.currentXp + xp;
    let level = user.level;
    let xpToNextLevel = user.xpToNextLevel;
    let maxHp = user.maxHp;
    let maxMp = user.maxMp;

    // Level up
    while (currentXp >= xpToNextLevel) {
      currentXp -= xpToNextLevel;
      level++;
      xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
      maxHp += 100;
      maxMp += 50;
    }

    const rank = this.calculateRank(level);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        currentXp,
        level,
        xpToNextLevel,
        maxHp,
        maxMp,
        currentHp: maxHp,
        currentMp: maxMp,
        rank,
      },
      include: { stats: true },
    });
  }

  async addGold(userId: string, gold: number): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        gold: {
          increment: gold,
        },
      },
      include: { stats: true },
    });
  }

  async updateHp(userId: string, hp: number): Promise<User> {
    const user = await this.findById(userId);
    const newHp = Math.max(0, Math.min(user.maxHp, user.currentHp + hp));

    return this.prisma.user.update({
      where: { id: userId },
      data: { currentHp: newHp },
      include: { stats: true },
    });
  }

  async updateMp(userId: string, mp: number): Promise<User> {
    const user = await this.findById(userId);
    const newMp = Math.max(0, Math.min(user.maxMp, user.currentMp + mp));

    return this.prisma.user.update({
      where: { id: userId },
      data: { currentMp: newMp },
      include: { stats: true },
    });
  }

  async incrementStreak(userId: string): Promise<User> {
    const user = await this.findById(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streakDays = 1;

    if (user.lastActivityDate) {
      const lastDate = new Date(user.lastActivityDate);
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        streakDays = user.streakDays + 1;
      } else if (diffDays === 0) {
        streakDays = user.streakDays;
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        streakDays,
        lastActivityDate: new Date(),
      },
      include: { stats: true },
    });
  }

  private calculateRank(level: number): UserRank {
    if (level >= 50) return UserRank.S_RANK;
    if (level >= 40) return UserRank.A_RANK;
    if (level >= 30) return UserRank.B_RANK;
    if (level >= 20) return UserRank.C_RANK;
    if (level >= 10) return UserRank.D_RANK;
    return UserRank.E_RANK;
  }
}
