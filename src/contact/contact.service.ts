import { BadRequestException, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import 'dotenv/config';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from 'src/users/email.service';
import { Users } from 'src/users/entities/users.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

interface ContactData {
  name: string;
  email: string;
  message: string;
}

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    private readonly emailService: EmailService,
  ) {
  }

  async send({ name, email, message }: ContactData) {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

    if (!emailRegex.test(email)) {
      throw new BadRequestException('Ingrese un correo válido.');
    }

    const adminUsers = await this.userRepo.find({ where: { role: 'admin' } });
    const adminEmails = adminUsers.map(u => u.email);
    const subject = 'Mensaje';
    const fullMessage = `De: ${name}\nCorreo: ${email}\nMensaje: ${message}`;
    await this.emailService.sendEmail('Administrador', adminEmails, subject, fullMessage, '/');

    return {
      message: 'Mensaje enviado correctamente.',
    };
  }

  async newsletter({ email }: { email: string }) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

    if (!emailRegex.test(email)) {
      throw new BadRequestException('Ingrese un correo válido.');
    }

    const adminUsers = await this.userRepo.find({ where: { role: 'admin' } });
    const adminEmails = adminUsers.map(u => u.email);

    await this.emailService.sendEmail('Administrador', adminEmails, 'Suscripción', 'Hola administrador, hay un nuevo suscriptor al newsletter: ' + email, '/');

    return {
      message: 'Suscrito correctamente.',
    };
  }

}
