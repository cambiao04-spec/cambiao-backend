import { Module, forwardRef } from '@nestjs/common';
import { PayPlansService } from './payPlans.service';
import { PaymentsController } from './payments.controller';
import { Users } from 'src/users/entities/users.entity';
import { Plans } from 'src/plans/entities/plans.entity';
import { Payments } from './entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Earnings } from './entities/earnings.entity';
import { Chats } from 'src/chats/entities/chats.entity';
import { PayProductsService } from './payProducts.service';
import { MessagesModule } from 'src/messages/messages.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';
import { Funds } from './entities/funds.entity';
import { Balances } from './entities/balances.entity';
import { Arbitrations } from 'src/arbitrations/entities/arbitrations.entity';
import { PayArbitrationsService } from './payArbirations.service';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Plans, Payments, Earnings, Chats, Funds, Balances, Arbitrations]),
    MessagesModule,
    NotificationsModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [PaymentsController],
  providers: [PayPlansService, PayProductsService, PayArbitrationsService, PaymentsService],
  exports: [PayPlansService, TypeOrmModule, PayProductsService, PayArbitrationsService, PaymentsService],
})
export class PaymentsModule { }
