import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsNotEmpty, IsInt } from 'class-validator';

export class CreateMessageDto {
  @IsInt({ message: 'El ID del chat debe ser un número' })
  @IsNotEmpty({ message: 'El ID del chat es obligatorio' })
  chatId: number;

  @IsInt({ message: 'El ID del remitente debe ser un número' })
  @IsNotEmpty({ message: 'El ID del remitente es obligatorio' })
  senderId: number;

  @IsInt({ message: 'El ID del receptor debe ser un número' })
  @IsNotEmpty({ message: 'El ID del receptor es obligatorio' })
  receiverId: number;

  @IsString({ message: 'El contenido del mensaje debe ser texto' })
  @IsNotEmpty({ message: 'El contenido del mensaje es obligatorio' })
  @Transform(({ value }) => value.trim())
  content: string;

  @IsOptional()
  @IsEnum(['pendiente', 'aceptado', 'rechazado'])
  response_status?: 'pendiente' | 'aceptado' | 'rechazado';
}