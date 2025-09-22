
import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinay.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryController } from './cloudinay.controller';

@Module({
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryProvider, CloudinaryService],
  controllers: [CloudinaryController],
})
export class CloudinaryModule {}