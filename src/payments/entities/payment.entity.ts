import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from '../../users/entities/users.entity';
import { Plans } from 'src/plans/entities/plans.entity';
import { Products } from 'src/products/entities/products.entity';

export enum PayType {
  PLAN = 'plan',
  ARBITRAJE = 'arbitraje',
  PRODUCTO = 'producto',
}

@Entity('payments')
export class Payments {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  paypal_id: string;

  @Column()
  users_id: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'users_id' })
  user: Users;

  @Column({ type: 'int', nullable: true })
  plans_id: number | null;

  @ManyToOne(() => Plans, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'plans_id' })
  plan: Plans | null;

  @Column({ type: 'int', nullable: true })
  arbitrations_id: number | null;d

  @Column({ type: 'int', nullable: true })
  products_id: number | null;

  @ManyToOne(() => Products, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'products_id' })
  product: Products | null;

  @Column({ type: 'enum', enum: PayType })
  type: PayType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
