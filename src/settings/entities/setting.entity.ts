import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('settings')
export class Setting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: false })
    maintenance_mode: boolean;
}
