import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) { }

  @Get('users')
  @UseGuards(AuthGuard)
  findAllUsers(@Request() req) {
    return this.ratingsService.RatingsUser(req.user.userId);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any) {
    return await this.ratingsService.createRating(body);
  }
}
