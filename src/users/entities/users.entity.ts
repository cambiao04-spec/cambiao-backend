import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UsersImages } from "./usersImages.entity";
import { Favorites } from "src/favorites/entities/favorites.entity";
import { CanceledAccounts } from "./canceledAccounts.entity";
import { Plans } from "src/plans/entities/plans.entity";
import { Opinions } from "src/opinions/entities/opinions.entity";

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'username' })
  username: string;

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password' })
  password: string;

  @Column({ name: 'isVerified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({
    type: 'enum',
    enum: ['superadmin', 'admin', 'client'],
    default: 'client',
  })
  role: 'superadmin' | 'admin' | 'client';

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @OneToMany(() => UsersImages, (img) => img.user)
  images: UsersImages[];

  @OneToMany(() => Favorites, favorite => favorite.user)
  favorites: Favorites[];

  @OneToMany(() => CanceledAccounts, cancelacion => cancelacion.user)
  cancelAccount: CanceledAccounts[];

  @OneToMany(() => Plans, plan => plan.user)
  plans: Plans[];

  @OneToMany(() => Opinions, (opinion) => opinion.user)
  opinions: Opinions[];
}
