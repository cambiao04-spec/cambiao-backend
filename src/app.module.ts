import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { CloudinaryModule } from './cloudinary/cloudinay.module';
import { join } from 'path';
import { UseradminModule } from './useradmin/useradmin.module';
import { SettingsModule } from './settings/settings.module';
import { GoogleModule } from './google/google.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ContactModule } from './contact/contact.module';
import { PlansModule } from './plans/plans.module';
import { PaymentsModule } from './payments/payments.module';
import { OpinionsModule } from './opinions/opinions.module';
import { BlogsModule } from './blogs/blogs.module';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import 'dotenv/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ArbitrationsModule } from './arbitrations/arbitrations.module';
import { RatingsModule } from './ratings/ratings.module';
import { IdentitiesModule } from './identities/identities.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      connectTimeout: 60000,
      entities: [join(__dirname + '/**/*.entity{.ts,.js}')],
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    }),
    UsersModule,
    CloudinaryModule,
    UseradminModule,
    SettingsModule,
    GoogleModule,
    CategoriesModule,
    ProductsModule,
    IdentitiesModule,
    FavoritesModule,
    ContactModule,
    PlansModule,
    PaymentsModule,
    OpinionsModule,
    BlogsModule,
    ChatsModule,
    MessagesModule,
    NotificationsModule,
    ArbitrationsModule,
    RatingsModule,
    WithdrawalsModule,

  ],
})
export class AppModule { }
