import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateArbitrationsDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(400, { message: 'El motivo no puede superar los 400 caracteres' })
  @Transform(({ value }) => value.trim())
  reason: string;

  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(400, { message: 'La descripción no puede superar los 400 caracteres' })
  @Transform(({ value }) => value.trim())
  description: string;

  @IsNotEmpty({ message: 'El ID del chat es obligatorio' })
  @IsInt({ message: 'El ID del chat debe ser un número entero' })
  chats_id: number;
}
