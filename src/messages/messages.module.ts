import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Messages } from './entities/messages.entity';
import { Chats } from 'src/chats/entities/chats.entity';
import { Users } from 'src/users/entities/users.entity';
import { Notifications } from 'src/notifications/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notifications, Messages, Chats, Users])],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule { }
