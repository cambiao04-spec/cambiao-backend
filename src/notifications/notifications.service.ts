import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from 'src/users/entities/users.entity';
import { Chats } from 'src/chats/entities/chats.entity';
import { Repository } from 'typeorm';
import { Notifications } from './entities/notification.entity';

@Injectable()
export class NotificationsService {

  constructor(
    @InjectRepository(Notifications)
    private readonly notificationRepository: Repository<Notifications>,

    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,

    @InjectRepository(Chats)
    private readonly chatRepository: Repository<Chats>,
  ) { }

  async create(createNotificationDto: CreateNotificationDto) {
    const { userId, chatId } = createNotificationDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });

    if (!user || !chat) throw new Error('Usuario o chat no encontrado');

    const notification = this.notificationRepository.create({
      user,
      chat,
    });

    return this.notificationRepository.save(notification);
  }

  async findAll() {
    return this.notificationRepository.find({
      relations: ['user', 'chat'],
      order: { created_at: 'DESC' },
    });
  }

  async findByEmail(email: string) {
    return this.notificationRepository.find({
      where: { user: { email }, is_read: false },
      relations: ['chat'],
      order: { created_at: 'DESC' },
    });
  }

  async markAsRead(id: number) {
    await this.notificationRepository.update(id, { is_read: true });
    return { status: 'marked as read' };
  }

  async remove(id: number) {
    return this.notificationRepository.delete(id);
  }

  async markAsReadByChat(chatId: number) {
    return this.notificationRepository.update(
      { chat: { id: chatId }, is_read: false },
      { is_read: true }
    );
  }

}
