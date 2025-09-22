import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from './users.entity';

@Entity('users_images')
export class UsersImages {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'url' })
  url: string;

  @ManyToOne(() => Users, (user) => user.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'users_id' })
  user: Users;

  @Column({ type: 'enum', enum: ['fotoPerfil', 'cedulaFrontal', 'cedulaTrasera', 'selfie'], default: 'fotoPerfil' })
  type: 'fotoPerfil' | 'cedulaFrontal' | 'cedulaTrasera' | 'selfie';
}
