import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Blogs } from './blogs.entity';

@Entity('blog_images')
export class BlogImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @ManyToOne(() => Blogs, (blog) => blog.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blogs_id' })
  blog: Blogs;
}