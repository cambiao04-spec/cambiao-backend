import { IsNotEmpty } from "class-validator";

export class CreateChatDto {
  @IsNotEmpty({ message: 'El ID del usuario uno es obligatorio' })
  user_one_id: number;

  @IsNotEmpty({ message: 'El ID del usuario dos es obligatorio' })
  user_two_id: number;

  @IsNotEmpty({ message: 'El ID del producto uno es obligatorio' })
  product_id_one: number;

  @IsNotEmpty({ message: 'El ID del producto dos es obligatorio' })
  product_id_two?: number;

  @IsNotEmpty({ message: 'El cambio de nombre es obligatorio' })
  nameChange: string;
}
