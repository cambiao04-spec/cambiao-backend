import { Module } from '@nestjs/common';
import { UseradminService } from './useradmin.service';
import { UseradminController } from './useradmin.controller';
import { Users } from 'src/users/entities/users.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinay.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersImages } from 'src/users/entities/usersImages.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, UsersImages]), CloudinaryModule],
  controllers: [UseradminController],
  providers: [UseradminService],
})
export class UseradminModule { }
