import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateFavoriteDto {
	@IsInt({ message: 'El ID del producto debe ser un número entero' })
	@IsNotEmpty({ message: 'El ID del producto es obligatorio' })
	products_id: number;

	@IsInt({ message: 'El ID del usuario debe ser un número entero' })
	@IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
	users_id: number;
}
