import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
import * as streamifier from 'streamifier';
import * as path from 'path';

@Injectable()
export class CloudinaryService {

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'cambiao' },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Error desconocido en la respuesta de Cloudinary'));
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
  
  async deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      console.error('Error al eliminar el archivo de Cloudinary:', error);
      throw new InternalServerErrorException('Error al eliminar el archivo de Cloudinary');
    }
  }

}
