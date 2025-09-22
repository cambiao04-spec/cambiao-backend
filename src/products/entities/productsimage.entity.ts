import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Products } from './products.entity';

@Entity('products_image')
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'url' })
  url: string;

  @ManyToOne(() => Products, product => product.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'products_id' })
  product: Products;
}
