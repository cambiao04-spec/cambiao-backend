
import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { Users } from 'src/users/entities/users.entity';
import { Payments, PayType } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { URL_BACKEND, URL_FRONTEND } from 'src/url';
import axios from 'axios';
import { Chats } from 'src/chats/entities/chats.entity';
import { MessagesService } from 'src/messages/messages.service';
import { CreateMessageDto } from 'src/messages/dto/create-messages.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreateNotificationDto } from 'src/notifications/dto/create-notification.dto';
import { EmailService } from 'src/users/email.service';
import { Funds, FundsStatus } from './entities/funds.entity';
import { exchangeRateCurrencyUsd } from 'src/validationUtils';

@Injectable()
export class PayProductsService {

    constructor(
        @InjectRepository(Payments)
        private readonly payRepo: Repository<Payments>,
        @InjectRepository(Chats)
        private readonly chatRepository: Repository<Chats>,
        @InjectRepository(Users)
        private readonly userRepository: Repository<Users>,
        @Inject(forwardRef(() => MessagesService))
        private readonly messageService: MessagesService,
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService,
        @InjectRepository(Funds)
        private readonly fundsRepository: Repository<Funds>,
        private readonly emailService: EmailService,
    ) { }

    async createPaymentWithProduct(id: number) {

        const chat = await this.chatRepository.findOne({
            where: { id },
            relations: ['userOne', 'userTwo', 'productOne', 'productTwo'],
        });

        if (!chat) {
            throw new NotFoundException('Chat no encontrado');
        }

        const montoProducto = chat.productOne?.price ? Number(chat.productOne.price) : null;
        const currency = chat.productOne?.currency ? chat.productOne.currency : '';

        if (!montoProducto) {
            throw new NotFoundException('El producto no tiene precio definido');
        }

        let montoConvertido: number;
        try {
            montoConvertido = await exchangeRateCurrencyUsd(currency, montoProducto);
        } catch (err) {
            return { error: 'Error al convertir DOP a USD', detalle: err?.message || err };
        }

        const return_url = `${URL_BACKEND}/payments/capture-product?chatId=${chat.id}`;
        const cancel_url = `${URL_FRONTEND}/chats/me/${chat.id}`;

        let approvalUrl: string;
        try {
            const order = {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: montoConvertido
                        },
                    },
                ],
                application_context: {
                    brand_name: 'Cambiao',
                    landing_page: 'NO_PREFERENCE',
                    user_action: 'PAY_NOW',
                    return_url,
                    cancel_url,
                },
            };

            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');

            const urlPaypalToken = process.env.URL_PAYPAL_TOKEN ?? "";
            if (!urlPaypalToken) throw new Error("URL_PAYPAL_TOKEN no está definida en las variables de entorno.");

            const { data: { access_token } } = await axios.post(
                urlPaypalToken,
                params,
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    auth: {
                        username: process.env.CLIENT_PAYPAL_ID ?? "",
                        password: process.env.SECRET_PAYPAL_ID ?? "",
                    },
                },
            );

            const urlPaypalOrders = process.env.URL_PAYPAL_ORDERS ?? "";
            if (!urlPaypalOrders) throw new Error("URL_PAYPAL_ORDERS no está definida en las variables de entorno.");

            const { data } = await axios.post(
                urlPaypalOrders,
                order,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                },
            );

            const approvalLink = data.links.find(link => link.rel === "approve");
            if (!approvalLink || !approvalLink.href) {
                throw new Error('No se recibió el enlace de aprobación de PayPal.');
            }
            approvalUrl = approvalLink.href;
        } catch (error) {
            console.error(error?.response?.data || error);
            let msg = 'Error al crear la orden en PayPal';
            if (error instanceof Error && error.message) {
                msg = error.message;
            } else if (typeof error === 'string') {
                msg = error;
            } else if (error?.response?.data?.message) {
                msg = error.response.data.message;
            }
            throw new Error(msg);
        }

        return { approvalUrl };
    }

    async captureProductPayment(token: string, chatId: number) {

        const chat = await this.chatRepository.findOne({
            where: { id: chatId },
            relations: ['userOne', 'userTwo', 'productOne'],
        });

        if (!chat || !chat.productOne) {
            throw new NotFoundException('Chat o producto no encontrado');
        }

        try {
            const data = await axios.post(
                `${process.env.URL_PAYPAL_ORDERS}/${token}/capture`,
                {},
                {
                    auth: {
                        username: process.env.CLIENT_PAYPAL_ID ?? "",
                        password: process.env.SECRET_PAYPAL_ID ?? "",
                    },
                },
            );

            await this.payRepo.save({
                paypal_id: data.data.id,
                users_id: chat.userOne.id,
                plans_id: null,
                arbitrations_id: null,
                products_id: chat.productOne.id,
                type: PayType.PRODUCTO,
                amount: Number(chat.productOne.price),
                created_at: new Date(),
            });

            await this.fundsRepository.save({
                users_id: chat.userTwo.id,
                chats_id: chat.id,
                amount: Number(chat.productOne.price),
                status: FundsStatus.PENDIENTE,
                currency: chat.productOne.currency,
            });

            chat.payment = true;
            await this.chatRepository.save(chat);

            const mensaje = `✅ Pago realizado correctamente.\n\nCuando recibas el producto, puedes finalizar el chat.`;

            const createMessageDto: CreateMessageDto = {
                chatId: chat.id,
                senderId: chat.userTwo.id,
                receiverId: chat.userOne.id,
                content: mensaje,
            };

            await this.messageService.create(createMessageDto);

            const createNotificationDto: CreateNotificationDto = {
                userId: chat.userTwo.id,
                chatId: chat.id,
            };
            await this.notificationsService.create(createNotificationDto);

            const userTwo = await this.userRepository.findOne({ where: { id: chat.userTwo.id } });

            if (!userTwo) {
                throw new NotFoundException('Usuario no encontrado.');
            }

            const destinatarioEmail = userTwo.email;
            const subject = '¡Pago realizado!';
            const message = `🎉 ¡Hola se ha realizado un pago exitoso! Ingresa a tu cuenta para ver los detalles.`;

            await this.emailService.sendEmail(userTwo.username, destinatarioEmail, subject, message, '/');

        } catch (error) {
            console.error(error?.response?.data || error);
            let msg = 'Error al capturar el pago de producto en PayPal';
            if (error instanceof Error && error.message) {
                msg = error.message;
            } else if (typeof error === 'string') {
                msg = error;
            } else if (error?.response?.data?.message) {
                msg = error.response.data.message;
            }
            throw new Error(msg);
        }
    }

}
