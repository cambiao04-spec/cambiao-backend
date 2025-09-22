import { PartialType } from '@nestjs/swagger';
import { CreatePayDto } from './create-pay.dto';

export class UpdatePayDto extends PartialType(CreatePayDto) {}
