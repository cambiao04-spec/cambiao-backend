import { PartialType } from '@nestjs/swagger';
import { CreateBlogDto } from './create-blogs.dto';

export class UpdateBlogDto extends PartialType(CreateBlogDto) {}
