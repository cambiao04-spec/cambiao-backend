import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { UsersImages } from './entities/usersImages.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinay.module';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from './mailer.config';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/jwt.constants';
import { GoogleStrategy } from 'src/google/google.strategy';
import { FavoritesModule } from 'src/favorites/favorites.module';
import { ProductsModule } from 'src/products/products.module';
import { CanceledAccounts } from './entities/canceledAccounts.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, UsersImages, CanceledAccounts]),
    CloudinaryModule, FavoritesModule, ProductsModule,
  MailerModule.forRoot(mailerConfig),
  JwtModule.register({
    global: true,
    secret: jwtConstants.secret,
    signOptions: { expiresIn: '1d' },
  }),
  ],
  controllers: [UsersController],
  providers: [UsersService, EmailService, GoogleStrategy],
  exports: [UsersService, EmailService, TypeOrmModule],
})
export class UsersModule { }
