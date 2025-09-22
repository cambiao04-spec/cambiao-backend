import { Users } from 'src/users/entities/users.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

@Entity('identities')
export class Identities {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'users_id' })
  user: Users;

  @Column({ name: 'names' })
  names: string;

  @Column({ name: 'last_names' })
  last_names: string;

  @Column({ name: 'birth_date', type: 'date' })
  birth_date: Date;

  @Column({ type: 'enum', enum: ['Masculino', 'Femenino', 'No identificado'] })
  gender: 'Masculino' | 'Femenino' | 'No identificado';

  @Column({ type: 'enum', enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' })
  status: 'pendiente' | 'aprobado' | 'rechazado';

  @CreateDateColumn({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
