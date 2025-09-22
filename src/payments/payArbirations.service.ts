import { Injectable } from '@nestjs/common';
import { Users } from 'src/users/entities/users.entity';
import { Payments, PayType } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Earnings } from './entities/earnings.entity';
import { URL_BACKEND, URL_FRONTEND } from 'src/url';
import axios from 'axios';
import { Chats } from 'src/chats/entities/chats.entity';
import { Arbitrations } from 'src/arbitrations/entities/arbitrations.entity';
import { EmailService } from 'src/users/email.service';
import { CreateMessageDto } from 'src/messages/dto/create-messages.dto';
import { MessagesService } from 'src/messages/messages.service';

@Injectable()
export class PayArbitrationsService {

    constructor(
        @InjectRepository(Users)
        private readonly userRepo: Repository<Users>,
        @InjectRepository(Payments)
        private readonly payRepo: Repository<Payments>,
        @InjectRepository(Earnings)
        private readonly earningsRepo: Repository<Earnings>,
        @InjectRepository(Chats)
        private readonly chatRepository: Repository<Chats>,
        @InjectRepository(Arbitrations)
        private readonly arbitrajeRepository: Repository<Arbitrations>,
        private readonly emailService: EmailService,
        private readonly messageService: MessagesService,
    ) { }

    async createPaymentArbitraje(id: number, email: string, ruta?: string) {

        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) throw new Error('Usuario no encontrado');

        const return_url = ruta
            ? `${URL_BACKEND}/payments/capture-arbitraje?email=${email}&ruta=${encodeURIComponent(ruta)}&chatId=${id}`
            : `${URL_BACKEND}/payments/capture-arbitraje?email=${email}&chatId=${id}`;

        const cancel_url = ruta ? `${URL_FRONTEND}${ruta.startsWith('/') ? ruta : '/' + ruta}` : `${URL_FRONTEND}`;

        try {
            const order = {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: 5.00.toFixed(2),
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
            return { approvalUrl: approvalLink.href };

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
    }

    async capturePaymentArbitraje(token: string, data: { email: string, chatId: number }) {

        const { email, chatId } = data;

        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) throw new Error('Usuario no encontrado');

        const userId = user.id;

        try {
            const response = await axios.post(
                `${process.env.URL_PAYPAL_ORDERS}/${token}/capture`,
                {},
                {
                    auth: {
                        username: process.env.CLIENT_PAYPAL_ID ?? "",
                        password: process.env.SECRET_PAYPAL_ID ?? "",
                    },
                },
            );

            const montoPago = 5;

            const gananciasArr = await this.earningsRepo.find();
            let ganancia = gananciasArr[0];
            if (ganancia) {
                ganancia.amount = Number(ganancia.amount) + montoPago;
                await this.earningsRepo.save(ganancia);
            } else {
                ganancia = this.earningsRepo.create({ amount: montoPago });
                await this.earningsRepo.save(ganancia);
            }

            const arbitraje = await this.arbitrajeRepository.findOne({ where: { chats_id: chatId } });
            if (!arbitraje) throw new Error('Arbitraje no encontrado para este chat');

            arbitraje.payment = true;
            await this.arbitrajeRepository.save(arbitraje);

            const chat = await this.chatRepository.findOne({
                where: { id: chatId },
                relations: ['userOne', 'userTwo'],
            });

            if (!chat) {
                throw new Error('Chat no encontrado');
            }

            chat.cancellation_date = undefined;
            await this.chatRepository.save(chat);

            await this.payRepo.save({
                paypal_id: response.data.id,
                users_id: userId,
                plans_id: null,
                arbitrations_id: arbitraje.id,
                products_id: null,
                type: PayType.ARBITRAJE,
                amount: montoPago,
                created_at: new Date(),
            });

            const subject = '¡Nuevo arbitraje creado!';
            const message = '¡Hola! Se ha creado un nuevo arbitraje. Ingresa a tu cuenta para ver los detalles.';

            await this.emailService.sendEmail(chat.userOne.username, chat.userOne.email, subject, message, '/');
            await this.emailService.sendEmail(chat.userTwo.username, chat.userTwo.email, subject, message, '/');

            const adminUsers = await this.userRepo.find({ where: { role: 'admin' } });
            const adminEmails = adminUsers.map(u => u.email);

            await this.emailService.sendEmail('Administrador', adminEmails, 'Revisión de arbitraje requerida',
                'Estimado administrador,\n\nSe ha recibido un nuevo arbitraje que requiere revisión y validación. Por favor, accede al panel de administración para verificar la información y proceder con la aprobación o rechazo correspondiente.\n\nGracias.', '/'
            );

            const mensaje = `💬 ¡Este chat entro en discusión o arbitraje!`;

            const createMessageDto: CreateMessageDto = {
                chatId: chat.id,
                senderId: chat.userOne.id,
                receiverId: chat.userTwo.id,
                content: mensaje,
            };

            await this.messageService.create(createMessageDto);

        } catch (error) {
            console.error(error?.response?.data || error);
            let msg = 'Error al capturar el pago en PayPal';
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
