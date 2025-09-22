import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ProductImage } from './productsimage.entity';
import { ProductVideo } from './productsvideo.entity';
import { Favorites } from 'src/favorites/entities/favorites.entity';
import { Categories } from 'src/categories/entities/categories.entity';
import { Users } from 'src/users/entities/users.entity';

@Entity('products')
export class Products {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'description', nullable: true })
  description: string;

  @Column({ name: 'brand', nullable: true })
  brand: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: ['nuevo', 'semi-nuevo', 'usado', 'reparado'], default: 'nuevo' })
  status: 'nuevo' | 'semi-nuevo' | 'usado' | 'reparado';

  @Column({ default: false })
  offer: boolean;

  @Column({ type: 'enum', enum: ['pendiente', 'aprobado', 'rechazado', 'procesado'], default: 'pendiente' })
  status_approval: 'pendiente' | 'aprobado' | 'rechazado' | 'procesado';

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string;

  @OneToMany(() => ProductImage, img => img.product, { cascade: true })
  images: ProductImage[];

  @OneToMany(() => ProductVideo, vid => vid.product, { cascade: true })
  videos: ProductVideo[];

  @ManyToOne(() => Users, { eager: true })
  @JoinColumn({ name: 'users_id' })
  user: Users;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Categories, { eager: true })
  @JoinColumn({ name: 'categories_id' })
  category: Categories;

  @OneToMany(() => Favorites, favorite => favorite.product)
  favorites: Favorites[];
}
