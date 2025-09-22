import { forwardRef, Module } from '@nestjs/common';
import { CloudinaryModule } from 'src/cloudinary/cloudinay.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { UsersImages } from 'src/users/entities/usersImages.entity';
import { Users } from 'src/users/entities/users.entity';
import { Identities } from './entities/identities.entity';
import { IdentitiesController } from './identities.controller';
import { IdentitiesService } from './identities.service';

@Module({
  imports: [TypeOrmModule.forFeature([Identities, Users, UsersImages]), CloudinaryModule,
  forwardRef(() => UsersModule)],
  controllers: [IdentitiesController],
  providers: [IdentitiesService],
  exports: [IdentitiesService],
})
export class IdentitiesModule { }
