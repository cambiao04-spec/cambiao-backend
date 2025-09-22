import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";

export class EmailDto {
  @IsEmail()
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @MaxLength(255, { message: 'El email no puede superar los 255 caracteres' })
  @Transform(({ value }) => value.trim())
  email: string;
}