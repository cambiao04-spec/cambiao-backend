import { forwardRef, Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { Chats } from './entities/chats.entity';
import { Users } from 'src/users/entities/users.entity';
import { Products } from 'src/products/entities/products.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from 'src/users/email.service';
import { UsersModule } from 'src/users/users.module';
import { FavoritesModule } from 'src/favorites/favorites.module';
import { Favorites } from 'src/favorites/entities/favorites.entity';
import { Balances } from 'src/payments/entities/balances.entity';
import { Funds } from 'src/payments/entities/funds.entity';
import { MessagesModule } from 'src/messages/messages.module';

@Module({
  imports: [TypeOrmModule.forFeature([Chats, Users, Products, Favorites, Balances, Funds]), UsersModule, forwardRef(() => FavoritesModule), MessagesModule],
  controllers: [ChatsController],
  providers: [ChatsService, EmailService],
  exports: [ChatsService, TypeOrmModule],
})
export class ChatsModule { }
