import { IsNotEmpty, IsString, IsNumber, IsEnum, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
	@IsNotEmpty({ message: 'El nombre es obligatorio' })
	@IsString({ message: 'El nombre debe ser texto' })
	nombre: string;

	@IsNotEmpty({ message: 'La descripción es obligatoria' })
	@IsString({ message: 'La descripción debe ser texto' })
	@MaxLength(400, { message: 'La descripción no puede superar los 400 caracteres' })
	descripcion: string;

	@IsNotEmpty({ message: 'La marca es obligatoria' })
	@IsString({ message: 'La marca debe ser texto' })
	marca: string;

	@IsNotEmpty({ message: 'El precio es obligatorio' })
	@Type(() => Number)
	@IsNumber({}, { message: 'El precio debe ser un número' })
	@Min(0, { message: 'El precio debe ser mayor o igual a 0' })
	precio: number;

	@IsNotEmpty({ message: 'El estado es obligatorio' })
	@IsEnum(['nuevo', 'semi-nuevo', 'usado', 'reparado'], { message: 'El estado debe ser "nuevo", "semi-nuevo", "usado" o "reparado"' })
	estado: 'nuevo' | 'semi-nuevo' | 'usado' | 'reparado';

	@IsNotEmpty({ message: 'La categoría es obligatoria' })
	@Type(() => Number)
	@IsNumber({}, { message: 'La categoría debe ser un número' })
	category_id: number;
}
