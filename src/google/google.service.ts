import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcryptjs from "bcryptjs";
import * as crypto from 'crypto';
import { encryptToken } from 'src/validationUtils';

@Injectable()
export class GoogleService {

  constructor(
    private readonly userService: UsersService,
  ) { }

  async googleLogin(req) {
    try {

      let username = req.user?.username;
      const email = req.user?.email;

      if (!email) {
        throw new InternalServerErrorException("No se pudo obtener el correo del usuario.");
      }

      const password = process.env.PASSWORD_GOOGLE_DATA;

      if (!password) {
        throw new InternalServerErrorException("No se pudo obtener la contraseña para usuarios de Google (PASSWORD_GOOGLE_DATA no definida).");
      }

      const isVerified = true;
      const role = "client";

      let user = await this.userService.findByEmail(email);
      let token;

      if (!user) {
 
        let baseUsername = username || email.split('@')[0];
        let uniqueUsername = baseUsername;
        let exists = await this.userService.getUserProfileByUsername(uniqueUsername).catch(() => null);
        while (exists) {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
          uniqueUsername = `${baseUsername}${randomSuffix}`;
          exists = await this.userService.getUserProfileByUsername(uniqueUsername).catch(() => null);
        }
        username = uniqueUsername;
        const hashedPassword = await bcryptjs.hash(password, 10);
        user = await this.saveUser({ username, email, password: hashedPassword, isVerified, role });
      }
      token = await this.generateToken(user);
      return { token };
    } catch (error) {
      console.error("Error en googleLogin:", error);
      throw new InternalServerErrorException("Error en la autenticación con Google.");
    }
    
  }

  private async saveUser({ username, email, password, isVerified, role }) {
    try {
      return await this.userService.createGoogle({
        username,
        email,
        password
      });
    } catch (error) {
      console.error("Error al guardar el usuario:", error);
      throw new InternalServerErrorException("Error al guardar el usuario en la base de datos.");
    }
  }

  private async generateToken(user): Promise<string> {
    try {
      const payload = {
        email: user.email,
        user: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      return await encryptToken(payload);
    } catch (error) {
      console.error("Error al generar el token:", error);
      throw new InternalServerErrorException("Error al generar el token de autenticación.");
    }
  }

}
