
import { Controller, Get, Post, Body, Patch, Param, UseGuards, UseInterceptors, UploadedFiles, Request } from '@nestjs/common';
import { IdentitiesService } from './identities.service';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateIdentitiesDto } from './dto/create-identities.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('identities')
@Controller('identities')
export class IdentitiesController {

  constructor(private readonly identitiesService: IdentitiesService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMyDataUser(@Request() req) {
    const userId = req.user.userId;
    return await this.identitiesService.findOne(userId);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll() {
    return await this.identitiesService.findAll();
  }

  @Get('pending')
  @UseGuards(AuthGuard)
  async findAllPending() {
    return await this.identitiesService.findAllPending();
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'fotoPerfil', maxCount: 1 },
    { name: 'cedulaFrontal', maxCount: 1 },
    { name: 'cedulaTrasera', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]))
  async create(
    @Body() createIdentitiesDto: CreateIdentitiesDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return await this.identitiesService.createIdentities(userId, createIdentitiesDto, files);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: number, @Body() body: { estado: string | null, rejectionReason?: string }) {
    return this.identitiesService.update(+id, body);
  }

}
