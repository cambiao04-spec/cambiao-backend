import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PlansService } from './plans.service';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMyDataUser(@Request() req) {
    const userId = req.user.userId;
    return await this.plansService.findOne(userId);
  }

}
