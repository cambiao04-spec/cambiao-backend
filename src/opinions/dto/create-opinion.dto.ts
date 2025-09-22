import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateOpinionDto {
  @IsString({ message: 'La descripción debe ser texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MaxLength(400, { message: 'La descripción no puede superar los 400 caracteres' })
  @Transform(({ value }) => value.trim())
  descripcion: string;
}
