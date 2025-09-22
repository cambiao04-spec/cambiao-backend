import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Users } from '../../users/entities/users.entity';
import { Chats } from '../../chats/entities/chats.entity';

export enum FundsStatus {
  PENDIENTE = 'pendiente',
  LIBERADO = 'liberado',
}

@Entity('funds')
export class Funds {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  users_id: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'users_id' })
  user: Users;

  @Column()
  chats_id: number;

  @ManyToOne(() => Chats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chats_id' })
  chat: Chats;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: FundsStatus, default: FundsStatus.PENDIENTE })
  status: FundsStatus;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at: Date;
}
