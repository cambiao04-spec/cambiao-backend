import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Users } from './users.entity';

@Entity('canceled_accounts')
export class CanceledAccounts {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'users_id' })
  users_id: number;

  @Column({ length: 255 })
  description: string;

  @ManyToOne(() => Users, user => user.cancelAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'users_id' })
  user: Users;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
