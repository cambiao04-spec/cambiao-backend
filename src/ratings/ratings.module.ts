import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { Chats } from 'src/chats/entities/chats.entity';
import { Ratings } from './entities/ratings.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Chats, Ratings])],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule { }
