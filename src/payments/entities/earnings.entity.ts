import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('earnings')
export class Earnings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;
}
