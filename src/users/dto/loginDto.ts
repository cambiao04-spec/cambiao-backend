import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';


export class LoginDto {
  @IsNotEmpty({ message: 'El email o nombre de usuario es obligatorio.' })
  @IsString({ message: 'El email o nombre de usuario debe ser un texto.' })
  @Transform(({ value }) => value.trim())
  user: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString({ message: 'La contraseña debe ser un texto.' })
  @Transform(({ value }) => value.trim())
  password: string;
}
