import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plans } from './entities/plans.entity';
import { PlansController } from './plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Plans])],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule { }
