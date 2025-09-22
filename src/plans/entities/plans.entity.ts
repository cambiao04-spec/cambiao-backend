import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from '../../users/entities/users.entity';

@Entity('plans')
export class Plans {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	users_id: number;

	@ManyToOne(() => Users, user => user.plans, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'users_id' })
	user: Users;

	@Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
	start_date: Date;

	@Column({ type: 'datetime', nullable: true })
	end_date: Date;

	@Column({ type: 'enum', enum: ['Plan gratuita', 'premium'], default: 'Plan gratuita' })
	type: 'gratuita' | 'premium';

}
