import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { URL_FRONTEND } from 'src/url';
import * as path from 'path';
import * as fs from 'fs';
import { MailerService } from '@nestjs-modules/mailer';
import { encryptToken } from 'src/validationUtils';

@Injectable()
export class EmailService {

  constructor(
    private readonly mailerService: MailerService,
  ) { }

  async sendEmail(username: string, email: string | string[], subject: string, message: string, ruta: string) {

    const token = await encryptToken({ email });

    const url = `${URL_FRONTEND}${ruta}?token=${token}`;
    const filePath = path.resolve(process.cwd(), 'src/html/plantilla.html');

    const htmlTemplate = fs.readFileSync(filePath, 'utf8');
    const personalizedHtml = htmlTemplate
      .replace('{{subject}}', subject)
      .replace('{{username}}', username)
      .replace('{{message}}', message)
      .replace('{{url}}', url);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Correo electrónico de Cambiao',
      html: personalizedHtml,
    });
  }
}
