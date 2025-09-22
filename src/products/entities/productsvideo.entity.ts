import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Products } from './products.entity';

@Entity('products_video')
export class ProductVideo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'url' })
  url: string;

  @ManyToOne(() => Products, product => product.videos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'products_id' })
  product: Products;
}
