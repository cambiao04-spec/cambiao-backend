import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BlogImage } from "./blogImage.entity";

@Entity('blogs')
export class Blogs {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'title' })
    title: string;

    @Column({ name: 'content', nullable: true })
    content?: string;

    @OneToMany(() => BlogImage, (img) => img.blog)
    images: BlogImage[];
}
