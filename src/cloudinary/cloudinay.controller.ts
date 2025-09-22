import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinay.service';

@ApiTags('Cloudinary')
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly CloudinaryService: CloudinaryService) {}
  @Post('postFile')
  @UseInterceptors(FileInterceptor('files'))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 500,
          }),
          new FileTypeValidator({ fileType: '(png|jpeg|jpg|mp4|pdf)' }),
        ],
      }),
    )
    files: Express.Multer.File,
  ) {
    return this.CloudinaryService.uploadFile(files);
  }
}
