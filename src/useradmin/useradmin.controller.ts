import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UseradminService } from './useradmin.service';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateRegisterAdminDto } from 'src/users/dto/createRegisterAdminDto';
import { UpdateRegisteruserDto } from 'src/users/dto/updateRegisterAdminDto';

@Controller('useradmin')
export class UseradminController {
  constructor(private readonly useradminService: UseradminService) { }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  createAdmin(
    @UploadedFile() image: Express.Multer.File,
    @Body() dto: CreateRegisterAdminDto,
  ) {
    return this.useradminService.createAdmin(dto, image);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAdmins() {
    return this.useradminService.findAdmins();
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() dto: UpdateRegisteruserDto,
  ) {
    return this.useradminService.updateAdmin(+id, dto, image);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.useradminService.removeAdmin(+id);
  }

}
