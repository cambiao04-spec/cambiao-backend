import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { OpinionsService } from './opinions.service';
import { OpinionsController } from './opinions.controller';
import { Opinions } from './entities/opinions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Opinions]), UsersModule],
  controllers: [OpinionsController],
  providers: [OpinionsService],
})
export class OpinionsModule {}
