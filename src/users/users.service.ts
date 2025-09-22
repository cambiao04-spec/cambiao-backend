
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Users } from './entities/users.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from './dto/registerDto';
import * as bcryptjs from 'bcryptjs';
import { LoginDto } from './dto/loginDto';
import { PasswordDto } from './dto/passwordDto';
import { EmailService } from './email.service';
import { EmailDto } from './dto/emailDto';
import { ProductsService } from '../products/products.service';
import { CanceledAccounts } from './entities/canceledAccounts.entity';
import { FavoritesService } from 'src/favorites/favorites.service';
import { encryptToken } from 'src/validationUtils';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private emailService: EmailService,
    @InjectRepository(CanceledAccounts)
    private readonly canceledAccountsRepo: Repository<CanceledAccounts>,
    private readonly productsService: ProductsService,
    private readonly favoritesService: FavoritesService,
  ) { }

  async getUserProfileByUsername(username: string) {

    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const allProducts = await this.productsService.findByUser(user.id);
    const products = allProducts.filter((p: any) => p.status_approval === 'aprobado');

    const ratingRepo = this.usersRepository.manager.getRepository('ratings');
    const ratings = await ratingRepo.find({
      where: { userTwo: { id: user.id } },
      relations: ['userOne']
    });

    const stars = ratings.length > 0 ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length) : 0;

    const comments = ratings.map(r => ({
      from: r.userOne?.username || '',
      rating: r.rating,
      comment: r.comment
    }));

    return {
      username: user.username,
      products,
      averageStars: stars,
      comments
    };
  }

  async findUserWithImages(email: string): Promise<Users | null> {
    return this.usersRepository.findOne({ where: { email }, relations: ['images'] });
  }

  async findByEmail(email: string): Promise<Users | null> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return user || null;
  }

  async countUsers(): Promise<number> {
    return this.usersRepository.count();
  }

  async createGoogle(createUserDto: RegisterDto) {
    return await this.usersRepository.save(createUserDto);
  }

  async register({ username, email, password }: RegisterDto) {

    try {

      const user = await this.usersRepository.findOneBy({ email });
      if (user) {
        throw new BadRequestException('El correo ya está registrado');
      }

      const userCount = await this.usersRepository.count();
      const isFirstUser = userCount === 0;

      const hashedPassword = await bcryptjs.hash(password, 10);

      let role: 'superadmin' | 'client';

      if (isFirstUser) {
        role = 'superadmin';
      } else {
        role = 'client';
      }

      const newUser = this.usersRepository.create({
        username,
        email,
        password: hashedPassword,
        isVerified: isFirstUser ? true : false,
        role
      });

      const savedUser = await this.usersRepository.save(newUser);

      if (savedUser.role === 'client') {
        const start_date = new Date();
        const end_date = null;
        const PlansRepo = this.usersRepository.manager.getRepository('plans');
        await PlansRepo.save({ users_id: savedUser.id, start_date, end_date, type: 'Plan gratuita' });
      }

      if (!isFirstUser) {
        const subject = 'Registro exitoso';
        const message = 'Por favor, verifica tu correo para activar tu cuenta.';
        await this.emailService.sendEmail(username, email, subject, message, '/iniciar-sesion');
      }

      return;
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async login({ user, password }: LoginDto): Promise<string> {

    const foundUser = await this.usersRepository.findOne({
      where: [
        { email: user },
        { username: user }
      ]
    });

    if (!foundUser) {
      throw new UnauthorizedException('Usuario o correo inválido');
    }

    const isPasswordValid = await bcryptjs.compare(password, foundUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña inválida');
    }

    if (!foundUser.isVerified) {
      throw new UnauthorizedException('Su cuenta no está verificada');
    }
    const payload = {
      email: foundUser.email,
      userId: foundUser.id,
      user: foundUser.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    return await encryptToken(payload);
  }

  async password(email: string, passDto: PasswordDto) {
    const user = await this.usersRepository.findOneBy({ email });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }


    if (passDto.password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }
    if (passDto.password !== passDto.verPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const hashedNewPassword = await bcryptjs.hash(passDto.password, 10);

    await this.usersRepository.update(
      { email },
      { password: hashedNewPassword },
    );

    return;
  }

  async token(email: string) {

    const user = await this.usersRepository.findOneBy({ email });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.usersRepository.update({ email }, { isVerified: true });

    const payload = {
      email,
      userId: user.id,
      user: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    return await encryptToken(payload);
  }

  async email({ email }: EmailDto) {
    try {

      const user = await this.usersRepository.findOneBy({ email });

      if (!user) {
        throw new BadRequestException(
          'Correo inválido.',
        );
      }

      if (!user.isVerified) {
        throw new BadRequestException('Su cuenta no está verificada');
      }

      if (user.role !== 'client') {
        throw new BadRequestException('Solo los clientes pueden realizar esta acción.');
      }

      const subject = 'Restablece tu contraseña';
      const message = 'Has solicitado cambiar tu contraseña en Cambiao. Haz clic en el botón de acceder para crear una nueva contraseña';
      await this.emailService.sendEmail(user.username, email, subject, message, '/cambiar-clave');
    } catch (error) {
      throw new BadRequestException('Error al buscar el usuario o tal vez su cuenta no está verificada aún.');
    }
  }

  async deleteAccount(userId: number, description: string) {

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');

    const productos = await this.productsService.findByUser(userId);
    for (const producto of productos) {
      await this.productsService.remove(producto.id);
    }

    const favoritos = await this.favoritesService.findAll(userId);
    for (const productId of favoritos) {
      await this.favoritesService.remove(productId, userId);
    }

    const cancelacion = this.canceledAccountsRepo.create({
      description,
      user: user,
    });

    await this.canceledAccountsRepo.save(cancelacion);

    user.email = `deleted_${user.email}`;
    await this.usersRepository.save(user);

  }

}
