import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('categories')
export class Categories {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name' })
    name: string;

    @Column({ name: 'description', nullable: true })
    description: string;
}
