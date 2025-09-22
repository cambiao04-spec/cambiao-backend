import { PartialType } from '@nestjs/swagger';
import { CreateIdentitiesDto } from './create-identities.dto';

export class UpdateIdentitiesDto extends PartialType(CreateIdentitiesDto) {}
