import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Users } from 'src/users/entities/users.entity';
import { Chats } from 'src/chats/entities/chats.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notifications } from './entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notifications, Users, Chats])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule { }
