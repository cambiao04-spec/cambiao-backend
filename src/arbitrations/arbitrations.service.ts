
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Arbitrations, StatusArbitrations } from './entities/arbitrations.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from 'src/users/entities/users.entity';
import { Payments } from 'src/payments/entities/payment.entity';
import { EmailService } from 'src/users/email.service';
import { Funds, FundsStatus } from 'src/payments/entities/funds.entity';
import { Balances } from 'src/payments/entities/balances.entity';
import { Chats } from 'src/chats/entities/chats.entity';
import { Products } from 'src/products/entities/products.entity';
import { Ratings } from 'src/ratings/entities/ratings.entity';
import { exchangeRateCurrencyLocal } from 'src/validationUtils';
import { PaymentsService } from 'src/payments/payments.service';

@Injectable()
export class ArbitrationsService {

  constructor(
    @InjectRepository(Arbitrations)
    private readonly arbitrationsRepository: Repository<Arbitrations>,
    @InjectRepository(Users)
    private usersRepo: Repository<Users>,
    @InjectRepository(Payments)
    private paymentsRepository: Repository<Payments>,
    @InjectRepository(Funds)
    private readonly fundsRepository: Repository<Funds>,
    @InjectRepository(Balances)
    private readonly balancesRepository: Repository<Balances>,
    @InjectRepository(Chats)
    private readonly chatsRepository: Repository<Chats>,
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    @InjectRepository(Ratings)
    private readonly ratingsRepository: Repository<Ratings>,
    private readonly emailService: EmailService,
    private readonly paymentsService: PaymentsService
  ) { }

  async create(body: any, userEmail: string) {
    try {
      const user = await this.usersRepo.findOne({ where: { email: userEmail } });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      const chatRepo = this.paymentsRepository.manager.getRepository(Chats);
      const chatEntity = await chatRepo.findOne({ where: { id: body.chat_id } });
      if (!chatEntity) throw new NotFoundException('No se encontró el chat.');

      if (!chatEntity.payment) {
        throw new NotFoundException('No puedes crear un arbitraje porque el chat no tiene pago realizado.');
      }

      const existingArbitraje = await this.arbitrationsRepository.findOne({
        where: {
          chats_id: body.chat_id,
          status: StatusArbitrations.PENDIENTE,
        },
      });

      if (existingArbitraje) {
        throw new NotFoundException('Ya existe un arbitraje pendiente para este chat.');
      }

      const arbitraje = this.arbitrationsRepository.create({
        chats_id: body.chat_id,
        reason: body.motivo,
        description: body.descripcion,
        status: StatusArbitrations.PENDIENTE,
        resolution_message: null,
        users_id: user.id,
      });
      const currency = await this.paymentsService.getCurrencyByUserIp();
      const montoConvertido = await exchangeRateCurrencyLocal(currency, 5);

      const destinatarioEmail = userEmail;
      const subject = '¡Nuevo arbitraje en Cambiao!';
      const message = `🎉 ¡Hola! Has iniciado un arbitraje. Recuerda que para que sea atendido debes realizar el pago correspondiente ${montoConvertido} ${currency}. Ingresa a tu cuenta, sección de arbitrajes, para completar el pago y ver el estado de tu solicitud.`;

      await this.emailService.sendEmail(user.username, destinatarioEmail, subject, message, '/');
      const result = await this.arbitrationsRepository.save(arbitraje);
      return {
        arbitraje: result,
        message: `Arbitraje enviado correctamente. Para que tu caso sea atendido, debes realizar un pago de ${montoConvertido} ${currency}.`
      };
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async findArbitrationsByUser(email: string) {
    try {
      const user = await this.usersRepo.findOne({ where: { email } });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      const arbitrajes = await this.arbitrationsRepository.createQueryBuilder('arbitraje')
        .leftJoinAndSelect('arbitraje.chat', 'chat')
        .leftJoinAndSelect('chat.userOne', 'userOne')
        .leftJoinAndSelect('chat.userTwo', 'userTwo')
        .where('arbitraje.user_id = :id', { id: user.id })
        .orderBy('arbitraje.created_at', 'DESC')
        .getMany();

      return arbitrajes.map(a => ({
        ...a,
        chat: {
          ...a.chat,
          userOne: { username: a.chat?.userOne?.username },
          userTwo: { username: a.chat?.userTwo?.username },
        }
      }));
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async findPagados() {
    try {
      const arbitrajes = await this.arbitrationsRepository.createQueryBuilder('arbitraje')
        .leftJoinAndSelect('arbitraje.chat', 'chat')
        .leftJoinAndSelect('chat.userOne', 'userOne')
        .leftJoinAndSelect('chat.userTwo', 'userTwo')
        .where('arbitraje.payment = :pagado', { pagado: true })
        .orderBy('arbitraje.created_at', 'DESC')
        .getMany();

      return arbitrajes.map(a => ({
        ...a,
        chat: {
          ...a.chat,
          userOne: { username: a.chat?.userOne?.username },
          userTwo: { username: a.chat?.userTwo?.username },
        }
      }));
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async resolverArbitraje(id: number, data: { ganador: string, resolucionMensaje: string }) {
    try {
      const arbitraje = await this.arbitrationsRepository.findOne({
        where: { id },
        relations: ['chat'],
      });
      if (!arbitraje) throw new NotFoundException('Arbitraje no encontrado');
      if (!arbitraje.chat) throw new NotFoundException('Chat no encontrado en el arbitraje');

      const chat = await this.chatsRepository.findOne({
        where: { id: arbitraje.chat.id },
        relations: ['userOne', 'userTwo', 'productOne', 'productTwo'],
      });
      if (!chat) throw new NotFoundException('Chat no encontrado');
      const userOne = chat.userOne;
      const userTwo = chat.userTwo;

      let ganador: Users | null = null;
      if (userOne?.username === data.ganador) {
        ganador = userOne;
      } else if (userTwo?.username === data.ganador) {
        ganador = userTwo;
      } else {
        throw new NotFoundException('Usuario ganador no encontrado en el chat');
      }

      const fondos = await this.fundsRepository.find({
        where: { chats_id: chat.id, status: FundsStatus.PENDIENTE },
      });
      if (!fondos.length) throw new NotFoundException('No hay fondos pendientes para este chat');

      const fondosPorMoneda: { [currency: string]: number } = {};
      for (const fondo of fondos) {
        const currency = fondo.currency;
        if (!fondosPorMoneda[currency]) {
          fondosPorMoneda[currency] = 0;
        }
        fondosPorMoneda[currency] += Number(fondo.amount);
        fondo.status = FundsStatus.LIBERADO;
        fondo.users_id = ganador.id;
        await this.fundsRepository.save(fondo);
      }

      let saldosActualizados: { [currency: string]: number } = {};
      for (const currency in fondosPorMoneda) {
        let saldo = await this.balancesRepository.findOne({ where: { users_id: ganador.id, currency } });
        if (!saldo) {
          saldo = this.balancesRepository.create({ users_id: ganador.id, balance: 0, currency });
        }
        saldo.balance = Number(saldo.balance) + fondosPorMoneda[currency];
        await this.balancesRepository.save(saldo);
        saldosActualizados[currency] = saldo.balance;
      }

      const productosProcesar: Products[] = [];
      if (chat.productOne) productosProcesar.push(chat.productOne);
      if (chat.productTwo) productosProcesar.push(chat.productTwo);
      for (const producto of productosProcesar) {
        producto.status_approval = 'procesado';
        await this.productsRepository.save(producto);
      }

      chat.process_performed = true;
      chat.status = 'procesado';
      await this.chatsRepository.save(chat);

      const perdedor = ganador.id === userOne.id ? userTwo : userOne;

      const ratingGanador = this.ratingsRepository.create({
        chat: chat,
        userOne: ganador,
        userTwo: perdedor,
        rating: 5,
        comment: 'Calificación automática tras resolución de arbitraje.',
      });

      const ratingPerdedor = this.ratingsRepository.create({
        chat: chat,
        userOne: perdedor,
        userTwo: ganador,
        rating: 2,
        comment: 'Calificación automática tras resolución de arbitraje.',
      });

      await this.ratingsRepository.save(ratingGanador);
      await this.ratingsRepository.save(ratingPerdedor);

      arbitraje.status = StatusArbitrations.RESUELTO;
      arbitraje.resolution_message = data.resolucionMensaje;
      arbitraje.winner = ganador.username
      await this.arbitrationsRepository.save(arbitraje);

      const subject = 'Resolución de arbitraje en Cambiao';
      const mensajeGanador = `¡Felicidades ${ganador.username}! Has ganado el arbitraje. Resolución: ${data.resolucionMensaje}`;
      const mensajePerdedor = `Hola ${perdedor.username}, lamentablemente no ganaste el arbitraje. Resolución: ${data.resolucionMensaje}`;

      if (ganador.email) {
        await this.emailService.sendEmail(ganador.username, ganador.email, subject, mensajeGanador, '/');
      }
      if (perdedor.email) {
        await this.emailService.sendEmail(perdedor.username, perdedor.email, subject, mensajePerdedor, '/');
      }
      return { success: true, message: 'Arbitraje resuelto correctamente', saldos: saldosActualizados };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error?.message || error);
    }
  }

  async remove(id: number) {
    try {
      return await this.arbitrationsRepository.delete(id);
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

}
