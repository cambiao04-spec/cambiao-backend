import { forwardRef, Module } from '@nestjs/common';
import { ArbitrationsService } from './arbitrations.service';
import { ArbitrationsController } from './arbitrations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Arbitrations } from './entities/arbitrations.entity';
import { Users } from 'src/users/entities/users.entity';
import { Payments } from 'src/payments/entities/payment.entity';
import { UsersModule } from 'src/users/users.module';
import { Balances } from 'src/payments/entities/balances.entity';
import { Funds } from 'src/payments/entities/funds.entity';
import { Ratings } from 'src/ratings/entities/ratings.entity';
import { Products } from 'src/products/entities/products.entity';
import { Chats } from 'src/chats/entities/chats.entity';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [TypeOrmModule.forFeature([Arbitrations, Users, Payments, Chats, Products, Ratings, Funds, Balances]),
  forwardRef(() => UsersModule), forwardRef(() => PaymentsModule)],
  controllers: [ArbitrationsController],
  providers: [ArbitrationsService],
  exports: [ArbitrationsService, TypeOrmModule],
})
export class ArbitrationsModule { }
