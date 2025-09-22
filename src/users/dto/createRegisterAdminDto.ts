import { IsEmail, IsIn, IsNotEmpty, IsString, Max, MaxLength, MinLength } from 'class-validator';

export class CreateRegisterAdminDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El nombre no debe exceder los 255 caracteres' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  username: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El nombre no debe exceder los 255 caracteres' })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString({ message: 'El rol debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsIn(['client', 'admin', 'superadmin'])
  role: 'client' | 'admin' | 'superadmin';
}