import { Chats } from "src/chats/entities/chats.entity";
import { Users } from "src/users/entities/users.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('notifications')
export class Notifications {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'users_id' })
    user: Users;

    @ManyToOne(() => Chats, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chats_id' })
    chat: Chats;

    @Column({ name: 'is_read', type: 'boolean', default: false })
    is_read: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    created_at: Date;
}
