import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Chats } from '../../chats/entities/chats.entity';
import { Users } from '../../users/entities/users.entity';
import { Balances } from 'src/payments/entities/balances.entity';

export enum StatusArbitrations {
    PENDIENTE = 'pendiente',
    RESUELTO = 'resuelto',
    RECHAZADO = 'rechazado',
}

@Entity('arbitrations')
export class Arbitrations {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    users_id: number;

    @ManyToOne(() => Users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'users_id' })
    user: Users;

    @Column()
    chats_id: number;

    @ManyToOne(() => Chats, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chats_id' })
    chat: Chats;

    @Column({ type: 'varchar', length: 255 })
    reason: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'enum', enum: StatusArbitrations, default: StatusArbitrations.PENDIENTE })
    status: StatusArbitrations;

    @Column({ type: 'text', nullable: true })
    resolution_message: string | null;

    @Column({ name: 'payment', type: 'boolean', default: false })
    payment: boolean;

    @Column({ type: 'varchar', length: 255 })
    winner: string;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
}
