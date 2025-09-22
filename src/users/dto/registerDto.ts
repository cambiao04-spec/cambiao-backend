import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength, IsNotEmpty, IsDefined, Matches, MaxLength } from "class-validator";

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio.' })
  @IsString({ message: 'El nombre de usuario debe ser un texto.' })
  @Matches(/^\S+$/, { message: 'El nombre de usuario no debe contener espacios.' })
  @MaxLength(255, { message: 'El nombre de usuario no debe exceder los 255 caracteres.' })
  username: string;

  @IsNotEmpty({ message: 'El email es obligatorio.' })
  @IsEmail({}, { message: 'El email debe ser válido.' })
  @MaxLength(255, { message: 'El email no debe exceder los 255 caracteres.' })
  @Transform(({ value }) => value.trim())
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString({ message: 'La contraseña debe ser un texto.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  @MaxLength(255, { message: 'La contraseña no debe exceder los 255 caracteres.' })
  @Transform(({ value }) => value.trim())
  password: string;
}

