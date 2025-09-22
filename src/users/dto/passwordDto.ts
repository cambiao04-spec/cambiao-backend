import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength } from "class-validator";

export class PasswordDto {
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(6, { message: 'La contraseña nueva debe tener al menos 6 caracteres' })
  @Transform(({ value }) => value.trim())
  password: string;

  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(6, { message: 'La confirmación debe tener al menos 6 caracteres' })
  @Transform(({ value }) => value.trim())
  verPassword: string;
}
