import { BadRequestException, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import 'dotenv/config';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from 'src/users/email.service';

interface ContactData {
  name: string;
  email: string;
  message: string;
}

@Injectable()
export class ContactService {
  constructor(
    private readonly emailService: EmailService,
  ) {
  }

  async send({ name, email, message }: ContactData) {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

    if (!emailRegex.test(email)) {
      throw new BadRequestException('Ingrese un correo válido.');
    }

    const subject = 'Mensaje de contacto';
    await this.emailService.sendEmail(name, email, subject, message, '/');

    return {
      message: 'Mensaje enviado correctamente.',
    };
  }

  async newsletter({ email }: { email: string }) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

    if (!emailRegex.test(email)) {
      throw new BadRequestException('Ingrese un correo válido.');
    }

    await this.emailService.sendEmail('Nuevo suscriptor', email, 'Nuevo suscriptor al newsletter', '', '/');

    return {
      message: 'Suscrito correctamente.',
    };
  }

}
