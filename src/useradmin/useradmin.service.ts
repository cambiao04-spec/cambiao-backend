import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/cloudinary/cloudinay.service';
import { CreateRegisterAdminDto } from 'src/users/dto/createRegisterAdminDto';
import { UsersImages } from 'src/users/entities/usersImages.entity';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { UpdateRegisteruserDto } from 'src/users/dto/updateRegisterAdminDto';
import { extractPublicId } from 'src/validationUtils';
import { Users } from 'src/users/entities/users.entity';

@Injectable()
export class UseradminService {

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private cloudinaryService: CloudinaryService,
    @InjectRepository(UsersImages)
    private imageRepo: Repository<UsersImages>,
  ) { }

  async createAdmin(dto: CreateRegisterAdminDto, file?: Express.Multer.File) {

    const existing = await this.usersRepository.findOne({
      where: [
        { email: dto.email },
        { username: dto.username }
      ]
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new BadRequestException('El correo ya está registrado');
      }
      if (existing.username === dto.username) {
        throw new BadRequestException('El nombre de usuario ya está registrado');
      }
    }

    const password = await bcryptjs.hash(dto.password, 10);

    const allowedRoles = ['client', 'admin', 'superadmin'] as const;
    const role = (dto.role && allowedRoles.includes(dto.role as any)) ? dto.role : 'client';

    const user = this.usersRepository.create({
      username: dto.username,
      email: dto.email,
      password,
      role,
      isVerified: true,
    });

    const savedUser = await this.usersRepository.save(user);

    if (file) {
      const upload = await this.cloudinaryService.uploadFile(file);
      const userImage = this.imageRepo.create({
        url: upload.secure_url,
        user: savedUser,
      });
      await this.imageRepo.save(userImage);
    }

    return { message: 'Usuario registrado correctamente' };
  }

  async findAdmins() {
    try {
      const admins = await this.usersRepository.find({
        where: { role: 'admin' },
        relations: ['images'],
      });

      return admins.map(({ password, ...rest }) => rest);
    } catch (error) {
      throw new Error('Error interno al obtener administradores');
    }
  }

  async updateAdmin(id: number, data: Partial<UpdateRegisteruserDto>, image?: Express.Multer.File) {

    const user = await this.usersRepository.findOne({ where: { id }, relations: ['images'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (data.email && data.email !== user.email) {
      const emailExists = await this.usersRepository.findOne({ where: { email: data.email } });
      if (emailExists && emailExists.id !== id) {
        throw new BadRequestException('El correo ya está en uso por otro usuario');
      }
    }

    if (data.username && data.username !== user.username) {
      const usernameExists = await this.usersRepository.findOne({ where: { username: data.username } });
      if (usernameExists && usernameExists.id !== id) {
        throw new BadRequestException('El nombre de usuario ya está en uso por otro usuario');
      }
    }

    if (data.password) {
      data.password = await bcryptjs.hash(data.password, 10);
    }

    const { ...dataWithoutPermissions } = data;

    const updated = Object.assign(user, dataWithoutPermissions);
    await this.usersRepository.save(updated);

    if (image) {
      if (user.images && user.images.length > 0) {
        for (const img of user.images) {
          const publicId = extractPublicId(img.url);
          if (publicId) {
            await this.cloudinaryService.deleteFile(publicId);
          }
        }
        await this.imageRepo.delete({ user: { id } });
      }

      const upload = await this.cloudinaryService.uploadFile(image);
      const userImage = this.imageRepo.create({
        url: upload.secure_url,
        user: updated,
      });
      await this.imageRepo.save(userImage);
    }


    return { message: 'Usuario actualizado' };
  }

  async removeAdmin(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    for (const image of user.images) {
      const publicId = extractPublicId(image.url);
      if (publicId) {
        try {
          await this.cloudinaryService.deleteFile(publicId);
        } catch (error) {
          console.error(`Error al eliminar imagen de Cloudinary`, error);
        }
      }
    }

    await this.usersRepository.remove(user);

    return { message: 'Usuario e imágenes eliminados con éxito' };
  }

}
