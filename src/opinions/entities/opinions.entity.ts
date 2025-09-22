import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from 'src/users/entities/users.entity';

@Entity('opinions')
export class Opinions {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Users, (user) => user.opinions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'users_id' })
  user: Users;
}
