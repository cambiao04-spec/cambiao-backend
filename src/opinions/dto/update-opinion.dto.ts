import { PartialType } from '@nestjs/swagger';
import { CreateOpinionDto } from './create-opinion.dto';

export class UpdateOpinionDto extends PartialType(CreateOpinionDto) {}
