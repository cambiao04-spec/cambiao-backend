import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Users } from '../../users/entities/users.entity';

export enum WithdrawalsStatus {
  PENDIENTE = 'pendiente',
  LIBERADO = 'liberado',
}

@Entity('withdrawals')
export class Withdrawals {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  users_id: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'users_id' })
  user: Users;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: WithdrawalsStatus, default: WithdrawalsStatus.PENDIENTE })
  status: WithdrawalsStatus;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at: Date;
}
