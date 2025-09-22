import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Users } from '../../users/entities/users.entity';
import { Products} from '../../products/entities/products.entity';
import { Messages } from 'src/messages/entities/messages.entity';

@Entity('chats')
export class Chats {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'users_id_one' })
    userOne: Users;

    @ManyToOne(() => Users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'users_id_two' })
    userTwo: Users;

    @ManyToOne(() => Products, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'products_id_one' })
    productOne: Products;

    @ManyToOne(() => Products, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'products_id_two' })
    productTwo?: Products;

    @Column({ name: 'nameChange', type: 'varchar', length: 255 })
    nameChange: string;

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    created_at: Date;

    @Column({ name: 'cancellation_date', type: 'datetime', nullable: true })
    cancellation_date?: Date;

    @Column({ name: 'process_performed', type: 'boolean', default: false })
    process_performed: boolean;

    @Column({ name: 'payment', type: 'boolean', default: false })
    payment: boolean;

    @Column({ type: 'enum', enum: ['en_curso', 'procesado'], default: 'en_curso' })
    status: 'en_curso' | 'procesado';

    @OneToMany(() => Messages, (message) => message.chat)
    messages: Messages[];
}