import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateIdentitiesDto {
	@IsNotEmpty()
	@IsString()
	nombres: string;

	@IsNotEmpty()
	@IsString()
	apellidos: string;

	@IsNotEmpty()
	@IsDateString()
	fechaNacimiento: string;

	@IsNotEmpty()
	@IsString()
	genero: string;
}
