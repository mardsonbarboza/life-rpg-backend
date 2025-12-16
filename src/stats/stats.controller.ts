import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { StatsService } from './stats.service';

import { IncreaseStatDto } from './dto/increase-stat.dto';
import { JwtAuthGuard } from '../guards/auth.guard';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get()
  async getStats(@Req() req: { user: any }) {
    return this.statsService.findByUserId(req.user.id);
  }

  @Put('increase')
  async increaseStat(@Req() req: { user: any }, @Body() dto: IncreaseStatDto) {
    return this.statsService.increaseStatWithPoints(
      req.user.id,
      dto.stat as any,
      dto.points,
    );
  }
}
