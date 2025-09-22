import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { ArbitrationsService } from './arbitrations.service';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('arbitrations')
@Controller('arbitrations')
export class ArbitrationsController {
  
  constructor(private readonly arbitrajeService: ArbitrationsService) { }

  @Get('by-user')
  @UseGuards(AuthGuard)
  async findByUser(@Request() req) {
    const email = req.user.email;
    return this.arbitrajeService.findArbitrationsByUser(email);
  }

  @Get('pagados')
  @UseGuards(AuthGuard)
  async findPagados() {
    return this.arbitrajeService.findPagados();
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: any, @Request() req) {
    const email = req.user.email;
    return this.arbitrajeService.create(body, email);
  }

  @Patch(':id/resolver')
  @UseGuards(AuthGuard)
  resolverArbitraje(@Param('id') id: string, @Body() body: any) {
    return this.arbitrajeService.resolverArbitraje(+id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: number) {
    return this.arbitrajeService.remove(+id);
  }

}
