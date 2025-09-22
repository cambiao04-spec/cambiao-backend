import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Earnings } from './entities/earnings.entity';
import { Balances } from './entities/balances.entity';
import { Funds } from './entities/funds.entity';
import axios from 'axios';
import { exchangeRateCurrencyLocal } from 'src/validationUtils';

@Injectable()
export class PaymentsService {

  constructor(
    @InjectRepository(Earnings)
    private readonly earningsRepo: Repository<Earnings>,
    @InjectRepository(Balances)
    private readonly balancesRepo: Repository<Balances>,
    @InjectRepository(Funds)
    private readonly fundsRepo: Repository<Funds>,
  ) { }

  async findAllGanancias(): Promise<Earnings[]> {
    return this.earningsRepo.find();
  }

  async updateGanancia(id: number, monto: number): Promise<Earnings | { error: string }> {

    const ganancia = await this.earningsRepo.findOne({ where: { id } });

    if (!ganancia) {
      return { error: 'Ganancia no encontrada' };
    }

    const montoActual = Number(ganancia.amount);

    if (monto > montoActual) {
      return { error: 'No puedes retirar más de lo disponible' };
    }

    ganancia.amount = Number((montoActual - monto).toFixed(2));
    await this.earningsRepo.save(ganancia);
    return ganancia;
  }

  async getBalanceByUserId(userId: number): Promise<Balances[]> {
    return await this.balancesRepo.find({
      where: {
        users_id: userId,
        balance: MoreThan(0)
      }
    });
  }

  async getFundsByUserId(userId: number): Promise<Funds[]> {
    return await this.fundsRepo.find({ where: { users_id: userId } });
  }

  async getCurrencyByCountry(country: string): Promise<string> {

    const currencyMap: Record<string, string> = {
      'AR': 'ARS', // Argentina
      'BO': 'BOB', // Bolivia
      'CL': 'CLP', // Chile
      'CO': 'COP', // Colombia
      'CR': 'CRC', // Costa Rica
      'CU': 'CUP', // Cuba
      'DO': 'DOP', // República Dominicana
      'EC': 'USD', // Ecuador
      'SV': 'USD', // El Salvador
      'GT': 'GTQ', // Guatemala
      'HN': 'HNL', // Honduras
      'MX': 'MXN', // México
      'NI': 'NIO', // Nicaragua
      'PA': 'PAB', // Panamá
      'PY': 'PYG', // Paraguay
      'PE': 'PEN', // Perú
      'PR': 'USD', // Puerto Rico
      'UY': 'UYU', // Uruguay
      'VE': 'VES', // Venezuela
    };
    return currencyMap[country] || 'USD';
  }

  async getCurrencyByUserIp(): Promise<string> {
    try {
      const { data } = await axios.get('https://ipwho.is/?fields=currency,country_code');
      if (data && data.currency && data.currency.code) {
        return data.currency.code;
      }
      if (data && data.country_code) {
        return this.getCurrencyByCountry(data.country_code);
      }
      return 'USD';
    } catch (e) {
      return 'USD';
    }
  }

  async getPricePlan() {
    try {
      const currency = await this.getCurrencyByUserIp();
      const valor = await exchangeRateCurrencyLocal(currency, 5);
      return { currency, valor };
    } catch (e) {
      return e;
    }
  }

}