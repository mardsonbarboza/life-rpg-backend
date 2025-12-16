import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';

import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { JwtAuthGuard } from '../guards/auth.guard';

@Controller('activity-log')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @Post()
  create(@Req() req: { user: any }, @Body() createActivityLogDto: CreateActivityLogDto) {
    return this.activityLogService.create(req.user.id, createActivityLogDto);
  }

  @Get()
  findAll(@Req() req: { user: any }, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit) : 50;
    return this.activityLogService.findAllByUser(req.user.id, parsedLimit);
  }

  @Get('recent')
  findRecent(@Req() req: { user: any }, @Query('days') days?: string) {
    const parsedDays = days ? parseInt(days) : 7;
    return this.activityLogService.findRecent(req.user.id, parsedDays);
  }

  @Get('stats')
  getStats(@Req() req: { user: any }) {
    return this.activityLogService.getStats(req.user.id);
  }

  @Get('type/:type')
  findByType(@Req() req: { user: any }, @Param('type') type: string) {
    return this.activityLogService.findByType(req.user.id, type);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activityLogService.delete(id);
  }

  @Delete()
  removeAll(@Req() req: { user: any }) {
    return this.activityLogService.deleteAll(req.user.id);
  }
}