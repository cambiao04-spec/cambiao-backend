import { Module } from '@nestjs/common';
import { BlogService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blogs } from './entities/blogs.entity';
import { BlogImage } from './entities/blogImage.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinay.module';

@Module({
  imports: [TypeOrmModule.forFeature([Blogs, BlogImage]), CloudinaryModule],
  controllers: [BlogsController],
  providers: [BlogService],
})
export class BlogsModule { }
