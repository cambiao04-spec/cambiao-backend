import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from '../../users/entities/users.entity';

@Entity('balances')
export class Balances {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  users_id: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'users_id' })
  user: Users;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;
}
