import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { FavoritesService } from './favorites.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {

  constructor(private readonly favoritesService: FavoritesService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  findAll(@Request() req) {
    return this.favoritesService.findAll(req.user.userId);
  }

  @Get('me/favorites')
  @UseGuards(AuthGuard)
  findAllMe(@Request() req) {
    return this.favoritesService.findAllMe(req.user.userId);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() body, @Request() req) {
    const dto = { ...body, users_id: req.user.userId };
    return this.favoritesService.create(dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.favoritesService.remove(+id, req.user.userId);
  }
}
