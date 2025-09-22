import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Chats } from '../../chats/entities/chats.entity';
import { Users } from '../../users/entities/users.entity';

@Entity('messages')
export class Messages {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Chats, (chat) => chat.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chats_id' })
    chat: Chats;

    @ManyToOne(() => Users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sender_id' })
    sender: Users;

    @ManyToOne(() => Users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'receiver_id' })
    receiver: Users;

    @Column('text')
    content: string;

    @Column({
        name: 'status',
        type: 'enum',
        enum: ['pendiente', 'aceptado', 'rechazado'],
        default: 'pendiente',
    })
    status: 'pendiente' | 'aceptado' | 'rechazado';

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    created_at: Date;
}
