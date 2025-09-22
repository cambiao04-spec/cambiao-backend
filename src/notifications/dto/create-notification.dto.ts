import { IsInt, IsNotEmpty } from "class-validator";

export class CreateNotificationDto {
    @IsInt({ message: 'El ID del usuario debe ser un número entero' })
    @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
    userId: number;

    @IsInt({ message: 'El ID del chat debe ser un número entero' })
    @IsNotEmpty({ message: 'El ID del chat es obligatorio' })
    chatId: number;
}