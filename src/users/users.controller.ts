
import { Controller, Post, Body, HttpCode, HttpStatus, Res, Get, UseGuards, Request, Param, Patch, UnauthorizedException, Query } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/registerDto';
import { LoginDto } from './dto/loginDto';
import { isProduction } from 'src/url';
import { AuthGuard } from './guard/auth.guard';
import { PasswordDto } from './dto/passwordDto';
import { decryptToken } from '../validationUtils';
import { EmailDto } from './dto/emailDto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  async getUser(@Request() req) {

    if (!req.user) {
      return null;
    }

    const user = await this.usersService.findUserWithImages(req.user.email);

    let image: string | null = null;
    if (user && user.images && user.images.length > 0) {
      image = user.images[0].url;
    }
    return {
      email: req.user.email,
      user: req.user.user,
      image
    };
  }

  @Get('count')
  async countUsers() {
    const count = await this.usersService.countUsers();
    return { count };
  }

  @Get('profile/:username')
  async getUserProfile(@Param('username') username: string) {
    return await this.usersService.getUserProfileByUsername(username);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Res() res: ExpressResponse) {
    res.clearCookie('ACCESS_TOKEN', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.json({ message: "Sesión cerrada correctamente" });
  }

  @Post('register')
  create(@Body() createUserDto: RegisterDto) {
    return this.usersService.register(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: ExpressResponse) {
    const token = await this.usersService.login(loginDto);
    res.cookie('ACCESS_TOKEN', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.json({ token });
  }

  @Post('delete-account')
  @UseGuards(AuthGuard)
  async deleteAccount(@Request() req, @Body() body: { description: string }) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('No autenticado');
    }
    return this.usersService.deleteAccount(userId, body.description);
  }

  @Post('email')
  email(@Body() email: EmailDto) {
    return this.usersService.email(email);
  }

  @Patch('password')
  @UseGuards(AuthGuard)
  async password(@Request() req, @Body() passDto: PasswordDto, @Res() res: ExpressResponse) {
    await this.usersService.password( req.user.email, passDto);
    return res.json({ message: 'Actualizado' });
  }

  @Patch('tokens')
  async token(@Body() body: { token: string }, @Res() res: ExpressResponse) {
    try {

      if (!body.token) {
        throw new UnauthorizedException("Token no proporcionado");
      }

      const payload = decryptToken(body.token);

      const token = await this.usersService.token(payload.email);

      res.cookie('ACCESS_TOKEN', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000,
      });

      return res.json({ token });

    } catch (error) {
      throw new UnauthorizedException("Token inválido o expirado");
    }
  }

}
