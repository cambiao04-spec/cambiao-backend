import { Products } from 'src/products/entities/products.entity';
import { Users } from 'src/users/entities/users.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';

@Entity('favorites')
export class Favorites {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, user => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'users_id' })
  user: Users;

  @ManyToOne(() => Products, product => product.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'products_id' })
  product: Products;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
