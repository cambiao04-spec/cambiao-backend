import { Injectable } from '@nestjs/common';
import { Users } from 'src/users/entities/users.entity';
import { Plans } from 'src/plans/entities/plans.entity';
import { Payments, PayType } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Earnings } from './entities/earnings.entity';
import { URL_BACKEND, URL_FRONTEND } from 'src/url';
import axios from 'axios';
import { EmailService } from 'src/users/email.service';

@Injectable()
export class PayPlansService {

  constructor(
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    @InjectRepository(Plans)
    private readonly planRepo: Repository<Plans>,
    @InjectRepository(Payments)
    private readonly payRepo: Repository<Payments>,
    @InjectRepository(Earnings)
    private readonly earningsRepo: Repository<Earnings>,
    private readonly emailService: EmailService,
  ) { }


  async createPayment(email: string, ruta?: string) {

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error('Usuario no encontrado');

    const return_url = ruta
      ? `${URL_BACKEND}/payments/capture?email=${email}&ruta=${encodeURIComponent(ruta)}`
      : `${URL_BACKEND}/payments/capture?email=${email}`;
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

  async capturePayment(token: string, data: { email: string }) {

    const { email } = data;
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error('Usuario no encontrado');
    const userId = user.id;
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

      const plan = await this.planRepo.findOne({ where: { users_id: userId } });
      const start_date = new Date();
      const end_date = new Date(start_date);
      end_date.setDate(end_date.getDate() + 30);
      if (plan) {
        plan.type = 'premium';
        plan.start_date = start_date;
        plan.end_date = end_date;
        await this.planRepo.save(plan);
      }

      await this.payRepo.save({
        paypal_id: data.data.id,
        users_id: userId,
        plans_id: plan ? plan.id : null,
        arbitrations_id: null,
        products_id: null,
        type: PayType.PLAN,
        amount: montoPago,
        created_at: new Date(),
      });

      const subject = '¡Gracias por tu compra en Cambiao!';
      const message = `🎉 Ahora puedes disfrutar de todas las ventajas y mejoras exclusivas de tu paquete.Si tienes alguna duda o necesitas ayuda, nuestro equipo está disponible para ti. ¡Bienvenido a una mejor experiencia en Cambiao!`;

      await this.emailService.sendEmail(user.username, email, subject, message, '/');

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