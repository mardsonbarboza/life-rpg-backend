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
import { QuestsService } from './quests.service';

import { CreateQuestDto } from './dto/create-quest.dto';
import { UpdateQuestProgressDto } from './dto/update-quest-progress.dto';
import { JwtAuthGuard } from '../guards/auth.guard';

@Controller('quests')
@UseGuards(JwtAuthGuard)
export class QuestsController {
  constructor(private questsService: QuestsService) {}

  @Post()
  create(@Req() req: { user: any }, @Body() createQuestDto: CreateQuestDto) {
    return this.questsService.create(req.user.id, createQuestDto);
  }

  @Get()
  findAll(@Req() req: { user: any }) {
    return this.questsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questsService.findOne(id);
  }

  @Put(':id/progress')
  updateProgress(@Param('id') id: string, @Body() dto: UpdateQuestProgressDto) {
    return this.questsService.updateProgress(id, dto);
  }

  @Put(':id/complete')
  complete(@Param('id') id: string) {
    return this.questsService.completeQuest(id);
  }

  @Put(':id/penalty')
  applyPenalty(@Param('id') id: string) {
    return this.questsService.applyPenalty(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questsService.delete(id);
  }
}
