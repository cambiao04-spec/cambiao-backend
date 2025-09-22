import { Injectable } from '@nestjs/common';
import { Earnings } from 'src/payments/entities/earnings.entity';
import { Balances } from 'src/payments/entities/balances.entity';
import { Withdrawals, WithdrawalsStatus } from './entities/withdrawals.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailService } from 'src/users/email.service';
import { exchangeRateCurrencyUsd } from 'src/validationUtils';
import { Users } from 'src/users/entities/users.entity';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Earnings)
    private readonly earningsRepo: Repository<Earnings>,
    @InjectRepository(Balances)
    private readonly balanceRepo: Repository<Balances>,
    @InjectRepository(Withdrawals)
    private readonly withdrawalsRepo: Repository<Withdrawals>,
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    private readonly emailService: EmailService,
  ) { }

  async findAllRetiro(): Promise<any[]> {
    const retiros = await this.withdrawalsRepo.find({
      relations: ['user'],
    });
    return retiros.map(r => ({
      id: r.id,
      monto: r.amount,
      estado: r.status,
      fecha: r.created_at,
      username: r.user?.username,
      email: r.user?.email,
    }));
  }

  async findAllRetiroUser(userId: number): Promise<any[]> {
    const retiros = await this.withdrawalsRepo.find({
      where: { users_id: userId },
    });
    return retiros.map(r => ({
      id: r.id,
      monto: r.amount,
      estado: r.status,
      fecha: r.created_at,
    }));
  }

  async createRetiro(userId: number, saldoId: number): Promise<{ error: string } | void> {

    const balance = await this.balanceRepo.findOne({ where: { users_id: userId, id: saldoId } });

    if (!balance?.balance || Number(balance.balance) == 0) {
      return { error: 'No tienes saldo suficiente para retirar.' };
    }

    const currency = balance.currency;

    const monto = await exchangeRateCurrencyUsd(currency, Number(balance.balance));
    const comisionTotal = +(monto * 0.07).toFixed(2);
    const montoRetiro = +(monto - comisionTotal).toFixed(2);

    balance.balance = 0;
    await this.balanceRepo.save(balance);

    let registroGanancia = await this.earningsRepo.findOne({ where: { id: 1 } });

    if (registroGanancia) {
      registroGanancia.amount = +(Number(registroGanancia.amount) + comisionTotal).toFixed(2);
      await this.earningsRepo.save(registroGanancia);
    } else {
      registroGanancia = this.earningsRepo.create({ amount: comisionTotal });
      await this.earningsRepo.save(registroGanancia);
    }

    const retiro = this.withdrawalsRepo.create({
      users_id: userId,
      amount: montoRetiro,
      status: WithdrawalsStatus.PENDIENTE,
    });

    await this.withdrawalsRepo.save(retiro);

    const adminUsers = await this.userRepo.find({ where: { role: 'admin' } });
    const adminEmails = adminUsers.map(u => u.email);
    const username = 'Administrador';
    const subject = 'Nuevo retiro solicitado';
    const message = '\n\nSe ha recibido un nuevo retiro que requiere revisión y validación. Por favor, accede al panel de administración para verificar la información y proceder con la aprobación o rechazo correspondiente.\n\nGracias.'
    const ruta = '/';

    await this.emailService.sendEmail(username, adminEmails, subject, message, ruta);

    return;
  }

  async updateEstadoRetiro(id: number, estado: WithdrawalsStatus) {
    const retiro = await this.withdrawalsRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!retiro) {
      return { error: 'Retiro no encontrado' };
    }

    const email = retiro.user?.email;

    retiro.status = estado;
    await this.withdrawalsRepo.save(retiro);
    const username = retiro.user?.username || 'Usuario';
    const subject = 'Retiro';
    const message = `🎉 ¡Hola su retiro de USD$ ${retiro.amount} ha sido enviado correctamente a su cuenta de PayPal!`;
    const ruta = '/';
    await this.emailService.sendEmail(username, email, subject, message, ruta);

    return { success: true, retiro };
  }

}
