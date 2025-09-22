import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Products } from './entities/products.entity';
import { ProductImage } from './entities/productsimage.entity';
import { ProductVideo } from './entities/productsvideo.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CloudinaryModule } from '../cloudinary/cloudinay.module';
import { UsersModule } from 'src/users/users.module';
import { PaymentsModule } from 'src/payments/payments.module';
import { IdentitiesModule } from 'src/identities/identities.module';
import { PlansModule } from 'src/plans/plans.module';
import { Users } from 'src/users/entities/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Products, ProductImage, ProductVideo, Users]),
    CloudinaryModule,
    forwardRef(() => IdentitiesModule),
    PlansModule,
    forwardRef(() => UsersModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule { }
