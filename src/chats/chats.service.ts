
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Products } from 'src/products/entities/products.entity';
import { Repository, Not } from 'typeorm';
import { Users } from 'src/users/entities/users.entity';
import { Chats } from './entities/chats.entity';
import { EmailService } from 'src/users/email.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Favorites } from 'src/favorites/entities/favorites.entity';
import { Funds, FundsStatus } from 'src/payments/entities/funds.entity';
import { Balances } from 'src/payments/entities/balances.entity';
import { MessagesService } from 'src/messages/messages.service';
import { CreateMessageDto } from 'src/messages/dto/create-messages.dto';
import { Arbitrations } from 'src/arbitrations/entities/arbitrations.entity';
import { In } from 'typeorm';

@Injectable()
export class ChatsService {

  constructor(
    @InjectRepository(Chats)
    private readonly chatRepository: Repository<Chats>,
    @InjectRepository(Products)
    private readonly productRepository: Repository<Products>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @InjectRepository(Favorites)
    private readonly favoriteRepository: Repository<Favorites>,
    private emailService: EmailService,
    @InjectRepository(Funds)
    private readonly fundsRepository: Repository<Funds>,
    @InjectRepository(Balances)
    private readonly balanceRepository: Repository<Balances>,
    private readonly messageService: MessagesService,
  ) { }

  async findChatsByUser(email: string) {

    const chats = await this.chatRepository.find({
      where: [
        { userOne: { email }, status: 'en_curso' },
        { userTwo: { email }, status: 'en_curso' },
      ],
      relations: [
        'userOne', 'userTwo',
        'userOne.images', 'userTwo.images',
        'productOne', 'productOne.user', 'productOne.images',
        'productTwo', 'productTwo.user', 'productTwo.images',
      ],
    });

    const chatIds = chats.map(c => c.id);
    const arbitrajesPagados = await this.chatRepository.manager.getRepository(Arbitrations).find({
      where: {
        chats_id: chatIds.length > 0 ? In(chatIds) : undefined,
        payment: true
      },
    });

    const formattedChats = chats.map(chat => {
      let me, contact;
      if (chat.userOne.email === email) {
        me = chat.userOne;
        contact = chat.userTwo;
      } else {
        me = chat.userTwo;
        contact = chat.userOne;
      }

      const getFotoPerfil = (images: any[] = []) => {
        const perfil = images.find(img => img.type === 'fotoPerfil');
        return perfil ? perfil.url : (images[0]?.url || null);
      };

      const tieneArbitrajePagado = arbitrajesPagados.some(a => a.chats_id === chat.id);

      const productOne = chat.productOne
        ? {
          ...chat.productOne,
          user: chat.productOne.user ? { username: chat.productOne.user.username, id: chat.productOne.user.id } : null,
        }
        : null;
      const productTwo = chat.productTwo
        ? {
          ...chat.productTwo,
          user: chat.productTwo.user ? { username: chat.productTwo.user.username, id: chat.productTwo.user.id } : null,
        }
        : null;

      return {
        id: chat.id,
        nameChange: chat.nameChange,
        createdAt: chat.created_at,
        fecha_cancelacion: chat.cancellation_date,
        pago: chat.payment,
        me: {
          id: me.id,
          username: me.username,
          email: me.email,
          image: getFotoPerfil(me.images),
        },
        contact: {
          id: contact.id,
          username: contact.username,
          email: contact.email,
          image: getFotoPerfil(contact.images),
        },
        productOne,
        productTwo,
        arbitrajePagado: tieneArbitrajePagado,
      };
    });

    return formattedChats;

  }

  async createChatFromProduct(email: string, product_id: number, tipo_accion: string) {

    const product = await this.productRepository.findOne({
      where: { id: product_id },
      relations: ['user'],
    });

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    const userTwoId = product.user.id;

    const userLogged = await this.userRepository.findOne({
      where: { email },
      select: { id: true },
    });

    if (!userLogged) {
      throw new Error('Usuario logueado no encontrado');
    }

    const nameChange = tipo_accion === 'Compra' ? 'Compra' : 'Intercambio';

    const chat = this.createChat({
      user_one_id: userLogged.id,
      user_two_id: userTwoId,
      product_id_one: product.id,
      nameChange,
    });

    return chat;

  }

  async createChat(createChatDto: CreateChatDto): Promise<Chats> {

    const { user_one_id, user_two_id, nameChange, product_id_one, product_id_two } = createChatDto;

    if (user_one_id === user_two_id) {
      throw new BadRequestException('No puedes crear un chat contigo mismo.');
    }

    const existingChat = await this.chatRepository.findOne({
      where: [
        {
          userOne: { id: user_one_id },
          userTwo: { id: user_two_id },
          productOne: { id: product_id_one },
          status: 'en_curso',
        },
        {
          userOne: { id: user_two_id },
          userTwo: { id: user_one_id },
          productTwo: product_id_two ? { id: product_id_two } : undefined,
          status: 'en_curso',
        },
      ],
      relations: ['productOne', 'productTwo'],
    });

    if (existingChat) {
      throw new BadRequestException({
        message: 'Ya existe un chat relacionado con ese producto.',
        chat: existingChat,
      });
    }

    const chat = this.chatRepository.create({
      userOne: { id: user_one_id },
      userTwo: { id: user_two_id },
      productOne: { id: product_id_one },
      productTwo: product_id_two ? { id: product_id_two } : undefined,
      nameChange,
    });

    const userOne = await this.userRepository.findOne({ where: { id: user_one_id } });
    const userTwo = await this.userRepository.findOne({ where: { id: user_two_id } });

    if (!userOne || !userTwo) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const destinatarioEmail = userTwo.email;
    const subject = '¡Nuevo chat en Cambiao!';
    const message = `🎉 ¡Hola se ha iniciado un chat contigo! Ingresa a tu cuenta para conversar.`;

    await this.emailService.sendEmail(userTwo.username, destinatarioEmail, subject, message, '/');

    const mensaje = `💬 ¡Hola estoy interesado en tu producto!`;

    const chats = await this.chatRepository.save(chat);

    const createMessageDto: CreateMessageDto = {
      chatId: chats.id,
      senderId: chats.userOne.id,
      receiverId: chats.userTwo.id,
      content: mensaje,
    };

    await this.messageService.create(createMessageDto);

    return chats;
  }

  async updateCancelDate(id: number, fecha_cancelacion: string, proceso_realizado?: boolean): Promise<Chats> {
    const chat = await this.chatRepository.findOne({ where: { id } });
    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }
    chat.cancellation_date = fecha_cancelacion ? new Date(fecha_cancelacion) : undefined;
    if (typeof proceso_realizado === 'boolean') {
      (chat as any).process_performed = proceso_realizado;
    }
    return await this.chatRepository.save(chat);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async logMutualFavorites() {

    const allFavorites = await this.favoriteRepository.find({ relations: ['user', 'product', 'product.user'] });

    const userFavorites: Record<number, Set<number>> = {};
    allFavorites.forEach(fav => {
      const userId = fav.user.id;
      const productOwnerId = fav.product.user.id;
      if (!userFavorites[userId]) userFavorites[userId] = new Set();
      userFavorites[userId].add(productOwnerId);
    });

    const mutuals: Array<{ userA: number; userB: number }> = [];
    Object.entries(userFavorites).forEach(([userA, favSetA]) => {
      favSetA.forEach(userB => {
        if (userFavorites[userB] && userFavorites[userB].has(Number(userA))) {

          if (Number(userA) < userB) {
            mutuals.push({ userA: Number(userA), userB });
          }
        }
      });
    });
    if (mutuals.length > 0) {

      for (const pair of mutuals) {

        const favA = allFavorites.find(f => f.user.id === pair.userA && f.product.user.id === pair.userB);
        const favB = allFavorites.find(f => f.user.id === pair.userB && f.product.user.id === pair.userA);
        const productAId = favA ? favA.product.id : null;
        const productBId = favB ? favB.product.id : null;

        if (productAId && productBId) {

          const chatExists = await this.chatRepository.findOne({
            where: [
              { userOne: { id: pair.userA }, userTwo: { id: pair.userB }, productOne: { id: productAId }, productTwo: { id: productBId } },
              { userOne: { id: pair.userB }, userTwo: { id: pair.userA }, productOne: { id: productBId }, productTwo: { id: productAId } },
            ],
          });

          if (!chatExists) {
            await this.createChat({
              user_one_id: pair.userA,
              user_two_id: pair.userB,
              product_id_one: productAId,
              product_id_two: productBId,
              nameChange: 'Intercambio',
            });
          }
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async eliminarChatsCancelados() {

    const notificationsService = this['notificationsService'] as any;

    const ahora = new Date();

    const todosChats = await this.chatRepository.find({
      relations: ['productOne', 'productTwo', 'userOne', 'userTwo'],
    });

    for (const chat of todosChats) {
      if (!chat || !chat.cancellation_date) {
        continue;
      }

      const fechaLimite = new Date(chat.cancellation_date.getTime() + 1 * 60 * 1000);
      if (fechaLimite > ahora) {
        continue;
      }

      const fondosPendientes = await this.fundsRepository.find({
        where: { chats_id: chat.id, status: FundsStatus.PENDIENTE },
      });

      for (const fondo of fondosPendientes) {

        let saldo = await this.balanceRepository.findOne({ where: { users_id: fondo.users_id, currency: fondo.currency } });

        if (!saldo) {
          saldo = this.balanceRepository.create({ users_id: fondo.users_id, balance: 0, currency: fondo.currency });
        }

        saldo.balance = Number(saldo.balance) + Number(fondo.amount);
        await this.balanceRepository.save(saldo);

        fondo.status = FundsStatus.LIBERADO;
        await this.fundsRepository.save(fondo);
      }

      if (chat.process_performed) {

        if (chat.productOne && chat.productOne.id) {
          await this.productRepository.update(chat.productOne.id, { status_approval: 'procesado' });
        }
        if (chat.productTwo && chat.productTwo.id) {
          await this.productRepository.update(chat.productTwo.id, { status_approval: 'procesado' });
        }
      }

      if (notificationsService && typeof notificationsService.markAsReadByChat === 'function') {
        await notificationsService.markAsReadByChat(chat.id);
      }
      await this.chatRepository.update(chat.id, { status: 'procesado' });
    }
  }

}
