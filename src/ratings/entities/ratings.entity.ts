
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { Chats } from "src/chats/entities/chats.entity";
import { Users } from "src/users/entities/users.entity";

@Entity('ratings')
export class Ratings {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Chats, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chats_id' })
    chat: Chats;

    @ManyToOne(() => Users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'users_id_one' })
    userOne: Users;

    @ManyToOne(() => Users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'users_id_two' })
    userTwo: Users;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    created_at: Date;
}