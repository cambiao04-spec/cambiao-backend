import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from "class-validator";
export class CreateContactDto {
    @IsString({ message: 'El nombre debe ser texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @MaxLength(255, { message: 'El nombre no puede superar los 255 caracteres' })
    @Transform(({ value }) => value.trim())
    name: string;

    @IsEmail()
    @IsNotEmpty({ message: 'El correo es obligatorio' })
    @MaxLength(255, { message: 'El correo no puede superar los 255 caracteres' })
    @Transform(({ value }) => value.trim())
    email: string;

    @IsString({ message: 'El mensaje debe ser texto' })
    @IsNotEmpty({ message: 'El mensaje es obligatorio' })
    @MinLength(6, { message: 'El mensaje debe tener al menos 6 caracteres.' })
    @MaxLength(400, { message: 'El mensaje no puede superar los 400 caracteres' })
    @Transform(({ value }) => value.trim())
    message: string;
}
