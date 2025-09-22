import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Messages } from './entities/messages.entity';
import { Chats } from '../chats/entities/chats.entity';
import { Users } from '../users/entities/users.entity';
import { CreateMessageDto } from './dto/create-messages.dto';
import { UpdateMessageDto } from './dto/update-messages.dto';
import { Notifications } from '../notifications/entities/notification.entity';
import 'dotenv/config';
const Pusher = require('pusher');

@Injectable()
export class MessagesService {
  private pusher: any;

  constructor(
    @InjectRepository(Messages)
    private readonly messageRepository: Repository<Messages>,

    @InjectRepository(Chats)
    private readonly chatRepository: Repository<Chats>,

    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,

    @InjectRepository(Notifications)
    private readonly notificationRepository: Repository<Notifications>,
  ) {
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  async create(createMessageDto: CreateMessageDto) {

    const { chatId, senderId, receiverId, content } = createMessageDto;

    const contactoRegex = /((\+\d{1,3}[- ]?)?\d{9,15})|(@[\w.-]+\.[a-zA-Z]{2,})|(correo|email|mail|tel[eé]fono|celular|whatsapp|wa.me|wsp|contacto|llámame|llamame|llámame|llamame|instagram|facebook|fb|ig|tiktok|twitter|x.com|linkedin|linkd|snapchat|snap|telegram|tg|signal|sms|directo|dm|mensaje privado|privado|número|numero|num\.?|nro\.?)/i;

    if (contactoRegex.test(content)) {
      throw new BadRequestException('Por seguridad, no está permitido compartir datos de contacto personales en el chat.');
    }

    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    const receiver = await this.userRepository.findOne({ where: { id: receiverId } });

    if (!chat || !sender || !receiver) {
      throw new Error('Chat, sender, or receiver not found');
    }

    const message = this.messageRepository.create({
      chat,
      sender,
      receiver,
      content,
    });

    const savedMessage = await this.messageRepository.save(message);

    const notification = this.notificationRepository.create({
      user: receiver,
      chat: chat,
    });

    await this.notificationRepository.save(notification);

    await this.pusher.trigger(`chat-${chatId}`, 'nuevo-mensaje', {
      senderId,
      receiverId,
      content,
      createdAt: savedMessage.created_at,
    });

    return savedMessage;
  }

  async findAll() {
    return this.messageRepository.find({
      relations: ['chat', 'sender', 'receiver'],
      order: { created_at: 'ASC' },
    });
  }

  async findByChat(chatId: number) {
    const messages = await this.messageRepository.find({
      where: { chat: { id: chatId } },
      relations: ['sender', 'receiver'],
      order: { created_at: 'ASC' },
    });
    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      response_status: msg.status,
      created_at: msg.created_at,
      sender: {
        id: msg.sender.id,
        name: msg.sender.username,
      },
      receiver: {
        id: msg.receiver.id,
        name: msg.receiver.username
      },
    }));
  }

  findOne(id: number) {
    return this.messageRepository.findOne({
      where: { id },
      relations: ['chat', 'sender', 'receiver'],
    });
  }

  async update(id: number, updateMessageDto: UpdateMessageDto) {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new BadRequestException('Mensaje no encontrado');
    }
    if (updateMessageDto.response_status) {
      message.status = updateMessageDto.response_status;
    }

    await this.messageRepository.save(message);
    return message;
  }

  remove(id: number) {
    return this.messageRepository.delete(id);
  }

}
