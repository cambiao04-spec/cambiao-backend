import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException
} from "@nestjs/common";
import { Request } from "express";
import * as crypto from "crypto";
import 'dotenv/config';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.originalUrl;
    const token = request.cookies?.ACCESS_TOKEN || (request.headers.authorization?.split(' ')[1]);

    if (!token) {
      if (path === "/users/me") {
        (request as any).user = null;
        return true;
      }
      throw new UnauthorizedException("Usuario no autenticado");
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET no está definido');

      const key = crypto.createHash('sha256').update(secret).digest();
      const [ivB64, authTagB64, encryptedB64] = token.split('.');
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');
      const encrypted = Buffer.from(encryptedB64, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      const payload = JSON.parse(decrypted);
      (request as any).user = payload;

      // this.validateRole(request);
    } catch (error) {
      if (path === "/users/me") {
        (request as any).user = null;
        return true;
      }
      throw new UnauthorizedException("Token inválido o expirado");
    }

    return true;
  }
}
