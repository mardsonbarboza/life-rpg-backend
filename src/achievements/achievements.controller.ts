import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AchievementsService } from './achievements.service';

import { CreateAchievementDto } from './dto/create-achievement.dto';
import { JwtAuthGuard } from '../guards/auth.guard';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private achievementsService: AchievementsService) {}

  @Post()
  create(@Req() req: { user: any }, @Body() createAchievementDto: CreateAchievementDto) {
    return this.achievementsService.create(req.user.id, createAchievementDto);
  }

  @Get()
  findAll(@Req() req: { user: any }) {
    return this.achievementsService.findAllByUser(req.user.id);
  }

  @Get('unlocked')
  findUnlocked(@Req() req: { user: any }) {
    return this.achievementsService.findUnlocked(req.user.id);
  }

  @Get('locked')
  findLocked(@Req() req: { user: any }) {
    return this.achievementsService.findLocked(req.user.id);
  }

  @Put(':id/unlock')
  unlock(@Param('id') id: string) {
    return this.achievementsService.unlock(id);
  }

  @Post('check')
  async check(@Req() req: { user: any }) {
    await this.achievementsService.checkAchievements(req.user.id);
    return { message: 'Conquistas verificadas' };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.achievementsService.delete(id);
  }
}