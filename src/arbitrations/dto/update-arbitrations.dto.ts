import { PartialType } from '@nestjs/swagger';
import { CreateArbitrationsDto } from './create-arbitrations.dto';

export class UpdateArbitrationsDto extends PartialType(CreateArbitrationsDto) {}
