import { Module } from '@nestjs/common';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalsController } from './withdrawals.controller';
import { Withdrawals } from './entities/withdrawals.entity';
import { Balances } from 'src/payments/entities/balances.entity';
import { Earnings } from 'src/payments/entities/earnings.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { Users } from 'src/users/entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Withdrawals, Balances, Earnings, Users]), UsersModule],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
})
export class WithdrawalsModule { }
