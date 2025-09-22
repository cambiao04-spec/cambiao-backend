import { PartialType } from '@nestjs/swagger';
import { CreateRegisterAdminDto } from './createRegisterAdminDto';

export class UpdateRegisteruserDto extends PartialType(CreateRegisterAdminDto) {}
