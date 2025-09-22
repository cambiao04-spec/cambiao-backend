import { Transform } from 'class-transformer';
import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateBlogDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString({ message: 'El nombre debe ser texto' })
    @MaxLength(255, { message: 'El nombre no puede superar los 255 caracteres' })
    @Transform(({ value }) => value.trim())
    title: string;
    
    @IsNotEmpty({ message: 'El contenido es obligatoria' })
    @IsString({ message: 'El contenido debe ser texto' })
    @MaxLength(400, { message: 'El contenido no puede superar los 400 caracteres' })
    @Transform(({ value }) => value.trim())
    content: string;
}