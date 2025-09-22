import { Injectable, NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blogs.dto';
import { UpdateBlogDto } from './dto/update-blogs.dto';
import { Blogs } from './entities/blogs.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogImage } from './entities/blogImage.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinay.service';
import { extractPublicId } from 'src/validationUtils';

@Injectable()
export class BlogService {

  constructor(
    @InjectRepository(Blogs)
    private blogRepo: Repository<Blogs>,
    @InjectRepository(BlogImage)
    private imageRepo: Repository<BlogImage>,
    private cloudinaryService: CloudinaryService,
  ) { }

  async create(createBlogDto: CreateBlogDto, image?: Express.Multer.File) {
    const blog = this.blogRepo.create(createBlogDto);
    const savedBlog = await this.blogRepo.save(blog);
    if (image) {
      const upload = await this.cloudinaryService.uploadFile(image);
      const blogImage = this.imageRepo.create({
        url: upload.secure_url,
        blog: savedBlog,
      });
      await this.imageRepo.save(blogImage);
    }
    return savedBlog;
  }

  async findAll() {
    try {
      const result = await this.blogRepo.find({ relations: ['images'] });
      return result;
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async findOne(id: number) {
    try {
      return await this.blogRepo.findOne({ where: { id }, relations: ['images'] });
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async update(id: number, updateBlogDto: UpdateBlogDto, image?: Express.Multer.File) {
    const blog = await this.blogRepo.findOne({ where: { id }, relations: ['images'] });
    if (!blog) throw new NotFoundException('Blog no encontrado');
    await this.blogRepo.update(id, updateBlogDto);
    if (image) {
      if (blog.images && blog.images.length > 0) {
        for (const img of blog.images) {
          const publicId = extractPublicId(img.url);
          if (publicId) {
            try {
              await this.cloudinaryService.deleteFile(publicId, 'image');
            } catch (error) {
              console.error(`Error al eliminar la imagen de Cloudinary`, error);
            }
          }
          await this.imageRepo.delete({ id: img.id });
        }
      }
      const upload = await this.cloudinaryService.uploadFile(image);
      const blogImage = this.imageRepo.create({
        url: upload.secure_url,
        blog: { id },
      });
      await this.imageRepo.save(blogImage);
    }
    return this.findOne(id);
  }

  async remove(id: number) {
    const blog = await this.blogRepo.findOne({ where: { id }, relations: ['images'] });
    if (!blog) throw new NotFoundException('Blog no encontrado');
    if (blog.images && blog.images.length > 0) {
      for (const img of blog.images) {
        const publicId = extractPublicId(img.url);
        if (publicId) {
          try {
            await this.cloudinaryService.deleteFile(publicId, 'image');
          } catch (error) {
            console.error(`Error al eliminar la imagen de Cloudinary`, error);
          }
        }
        await this.imageRepo.delete({ id: img.id });
      }
    }
    await this.blogRepo.delete(id);
    return { deleted: true };
  }

}
