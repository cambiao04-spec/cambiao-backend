import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CreateOpinionDto } from './dto/create-opinion.dto';
import { UpdateOpinionDto } from './dto/update-opinion.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { OpinionsService } from './opinions.service';

@ApiTags('opinions')
@Controller('opinions')
export class OpinionsController {

  constructor(private readonly opinionsService: OpinionsService) { }

  @Get()
  findAll() {
    return this.opinionsService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.opinionsService.findOne(+id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Request() req, @Body() createOpinionDto: CreateOpinionDto) {
    const email = req.user.email;
    return this.opinionsService.create(createOpinionDto, email);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateOpinionDto: UpdateOpinionDto) {
    return this.opinionsService.update(+id, updateOpinionDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.opinionsService.remove(+id);
  }
}
