import { PartialType } from '@nestjs/swagger';
import { CreateRatingDto } from './create-ratings.dto';

export class UpdateRatingDto extends PartialType(CreateRatingDto) {}
