import { PartialType } from '@nestjs/swagger';
import { CreateMessageDto } from './create-messages.dto';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {}
