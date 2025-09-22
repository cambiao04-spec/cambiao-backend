import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Products } from './entities/products.entity';
import { ProductImage } from './entities/productsimage.entity';
import { ProductVideo } from './entities/productsvideo.entity';
import { CloudinaryService } from '../cloudinary/cloudinay.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { EmailService } from 'src/users/email.service';
import { extractPublicId } from 'src/validationUtils';
import { IdentitiesService } from 'src/identities/identities.service';
import { PlansService } from 'src/plans/plans.service';
import { Payments } from 'src/payments/entities/payment.entity';
import { PaymentsService } from 'src/payments/payments.service';
import { Chats } from 'src/chats/entities/chats.entity';
import { Users } from 'src/users/entities/users.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private productRepo: Repository<Products>,
    @InjectRepository(Chats)
    private chatRepo: Repository<Chats>,
    @InjectRepository(ProductImage)
    private imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductVideo)
    private videoRepo: Repository<ProductVideo>,
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    private cloudinaryService: CloudinaryService,
    private identitiesService: IdentitiesService,
    private plansService: PlansService,
    private readonly emailService: EmailService,
    private readonly paymentsService: PaymentsService,
  ) { }

  async countProducts(): Promise<number> {
    return this.productRepo.count();
  }

  async createWithUser(createProductDto: CreateProductDto, files: Express.Multer.File[], userId: number) {
    try {

      const identities = await this.identitiesService.findOne(userId);

      if (!identities) {
        throw new HttpException('Debes verificar tu cuenta para publicar tus productos.', HttpStatus.BAD_REQUEST);
      }

      if (identities.status !== 'aprobado') {
        throw new BadRequestException('Tus datos aún no han sido aprobados. Recibirás un correo cuando tu verificación sea exitosa.');
      }

      const plan = await this.plansService.findOne(userId);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const productosEsteMes = await this.productRepo.count({
        where: {
          user: { id: userId },
          created_at: Between(startOfMonth, endOfMonth),
        },
      });

      let maxProductos = 3;
      let puedeVideo = false;
      if (plan && plan.type === 'premium') {
        maxProductos = 15;
        puedeVideo = true;
      }

      if (productosEsteMes >= maxProductos) {
        throw new HttpException(`Solo puedes publicar ${maxProductos} productos este mes según tu plan.`, HttpStatus.BAD_REQUEST);
      }

      const images = files ? files.filter(f => f.mimetype.startsWith('image/')) : [];
      let videos = files ? files.filter(f => f.mimetype.startsWith('video/')) : [];
      if (!puedeVideo) {
        if (videos.length > 0) {
          throw new HttpException('Debes adquirir un plan para poder agregar videos a tus productos.', HttpStatus.BAD_REQUEST);
        }
      }

      if (images.length === 0) throw new BadRequestException('Debes subir al menos una imagen');
      if (images.length > 3) throw new BadRequestException('Máximo 3 imágenes permitidas');
      if (videos.length > 1) throw new BadRequestException('Solo se permite 1 video');
      if (videos.length === 1 && videos[0].size > 10 * 1024 * 1024) throw new BadRequestException('El video no puede pesar más de 10MB');


      const currency = await this.paymentsService.getCurrencyByUserIp();

      const product = this.productRepo.create({
        name: createProductDto.nombre,
        description: createProductDto.descripcion,
        brand: createProductDto.marca,
        price: createProductDto.precio,
        status: createProductDto.estado,
        user: { id: userId },
        category: { id: createProductDto.category_id },
        currency
      });

      const savedProduct = await this.productRepo.save(product);

      for (const img of images) {
        const upload = await this.cloudinaryService.uploadFile(img);
        const productImage = this.imageRepo.create({
          url: upload.secure_url,
          product: savedProduct,
        });
        await this.imageRepo.save(productImage);
      }
      if (puedeVideo) {
        for (const vid of videos) {
          const upload = await this.cloudinaryService.uploadFile(vid);
          const productVideo = this.videoRepo.create({
            url: upload.secure_url,
            product: savedProduct,
          });
          await this.videoRepo.save(productVideo);
        }
      }

      const adminUsers = await this.userRepo.find({ where: { role: 'admin' } });
      const adminEmails = adminUsers.map(u => u.email);
      const username = 'Administrador';
      const subject = 'Revisión de producto requerida';
      const message = '\n\nSe ha recibido un nuevo producto que requiere revisión y validación. Por favor, accede al panel de administración para verificar la información y proceder con la aprobación o rechazo correspondiente.\n\nGracias.';
      const ruta = '/';

      await this.emailService.sendEmail(username, adminEmails, subject, message, ruta);

      return this.findOne(savedProduct.id);
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async findAllApproved() {

    const currency = await this.paymentsService.getCurrencyByUserIp();

    try {

      const products = await this.productRepo.find({
        where: { status_approval: 'aprobado', currency: currency },
        relations: ['images', 'videos', 'user', 'user.images', 'category'],
      });

      return products.map((product: any) => {
        const user = product.user;
        let profileImage = null;
        if (user && user.images && user.images.length > 0) {
          const perfil = user.images.find((img: any) => img.type === 'fotoPerfil');
          profileImage = perfil ? perfil.url : null;
        }
        return {
          ...product,
          user: {
            username: user?.username,
            profileImage,
          },
        };
      });
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async findAllPending() {
    try {
      const products = await this.productRepo.find({
        where: { status_approval: 'pendiente' },
        relations: ['images', 'videos', 'user', 'user.images', 'category'],
      });

      return products.map((product: any) => {
        const user = product.user;
        let profileImage = null;
        if (user && user.images && user.images.length > 0) {
          const perfil = user.images.find((img: any) => img.type === 'fotoPerfil');
          profileImage = perfil ? perfil.url : null;
        }
        return {
          ...product,
          user: {
            username: user?.username,
            profileImage,
          },
        };
      });
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async findAllOffer() {
    try {

      const products = await this.productRepo.find({
        where: { offer: true, status_approval: 'aprobado' },
        relations: ['images', 'videos', 'user', 'user.images', 'category'],
      });

      return products.map((product: any) => {
        const user = product.user;
        let profileImage = null;
        if (user && user.images && user.images.length > 0) {
          const perfil = user.images.find((img: any) => img.type === 'fotoPerfil');
          profileImage = perfil ? perfil.url : null;
        }
        return {
          ...product,
          user: {
            username: user?.username,
            profileImage,
          },
        };
      });
    } catch (error) {
      console.error('Error fetching products on offer:', error);
      throw new BadRequestException(error?.message || error);
    }
  }

  async findOne(id: number) {
    try {
      return await this.productRepo.findOne({ where: { id }, relations: ['images', 'videos'] });
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async findByUser(userId: number) {
    try {
      const { In } = require('typeorm');
      const products = await this.productRepo.find({
        where: {
          user: { id: userId },
          status_approval: In(['pendiente', 'aprobado'])
        },
        relations: ['images', 'videos', 'user']
      });
      return products.map((product: any) => ({
        ...product,
        user: { username: product.user?.username }
      }));
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto, files: Express.Multer.File[]) {
    try {

      const product = await this.productRepo.findOne({ where: { id }, relations: ['images', 'videos', 'user'] });
      if (!product) throw new NotFoundException('Producto no encontrado');

      const userId = product.user.id;
      const plan = await this.plansService.findOne(userId);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const productosEsteMes = await this.productRepo.count({
        where: {
          user: { id: userId },
          created_at: Between(startOfMonth, endOfMonth),
        },
      });

      let maxProductos = 3;
      let puedeVideo = false;
      if (plan) {
        maxProductos = 15;
        puedeVideo = true;
      }

      if (productosEsteMes > maxProductos) {
        throw new BadRequestException(`Solo puedes publicar ${maxProductos} productos este mes según tu plan.`);
      }

      const updateData: any = {};
      updateData.name = updateProductDto.nombre;
      updateData.description = updateProductDto.descripcion;
      updateData.brand = updateProductDto.marca;
      updateData.price = updateProductDto.precio;
      updateData.status = updateProductDto.estado;
      updateData.category = { id: updateProductDto.category_id };
      updateData.category = updateProductDto.category_id;
      updateData.status_approval = 'pendiente';

      await this.productRepo.update(id, updateData);

      if (files && files.length > 0) {
        if (product.images && product.images.length > 0) {
          for (const img of product.images) {
            const publicId = extractPublicId(img.url);
            if (publicId) {
              try {
                await this.cloudinaryService.deleteFile(publicId, 'image');
              } catch (error) {
                console.error(`Error al eliminar la imagen`, error);
              }
            }
            await this.imageRepo.delete({ id: img.id });
          }
        }

        if (product.videos && product.videos.length > 0) {
          for (const vid of product.videos) {
            const publicId = extractPublicId(vid.url);
            if (publicId) {
              try {
                await this.cloudinaryService.deleteFile(publicId, 'video');
              } catch (error) {
                console.error(`Error al eliminar el video`, error);
              }
            }
            await this.videoRepo.delete({ id: vid.id });
          }
        }

        const images = files.filter(f => f.mimetype.startsWith('image/'));
        let videos = files.filter(f => f.mimetype.startsWith('video/'));
        if (!puedeVideo) {
          if (videos.length > 0) {
            throw new BadRequestException('Debes adquirir un plan para poder agregar videos a tus productos.');
          }
        }
        if (images.length === 0) throw new BadRequestException('Debes subir al menos una imagen');
        if (images.length > 3) throw new BadRequestException('Máximo 3 imágenes permitidas');
        if (videos.length > 1) throw new BadRequestException('Solo se permite 1 video');
        if (videos.length === 1 && videos[0].size > 10 * 1024 * 1024) throw new BadRequestException('El video no puede pesar más de 10MB');

        for (const img of images) {
          const upload = await this.cloudinaryService.uploadFile(img);
          const productImage = this.imageRepo.create({
            url: upload.secure_url,
            product: { id },
          });
          await this.imageRepo.save(productImage);
        }

        if (puedeVideo) {
          for (const vid of videos) {
            const upload = await this.cloudinaryService.uploadFile(vid);
            const productVideo = this.videoRepo.create({
              url: upload.secure_url,
              product: { id },
            });
            await this.videoRepo.save(productVideo);
          }
        }
      }

      const username = 'Administrador';
      const email = process.env.GMAIL_USER || '';
      const subject = 'Revisión de producto requerida';
      const message = '\n\nSe ha recibido un nuevo producto que requiere revisión y validación. Por favor, accede al panel de administración para verificar la información y proceder con la aprobación o rechazo correspondiente.\n\nGracias.';
      const ruta = '/';

      await this.emailService.sendEmail(username, email, subject, message, ruta);

      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async toggleOffer(id: number, userId: number) {

    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const plan = await this.plansService.findOne(userId);
    if (!plan || plan.type !== 'premium') {
      throw new BadRequestException('Solo los usuarios con plan premium pueden agregar productos a ofertas');
    }

    if (product.status_approval !== 'aprobado') {
      throw new BadRequestException('Solo los productos aprobados pueden agregarse o actualizarse a oferta');
    }

    product.offer = !product.offer;
    await this.productRepo.save(product);
    return product;
  }

  async remove(id: number) {
    try {

      const chatAsociado = await this.chatRepo.findOne({
        where: [
          { productOne: { id } },
          { productTwo: { id } }
        ]
      });

      if (chatAsociado) {
        throw new BadRequestException('No se puede eliminar el producto porque está asociado a un chat.');
      }

      const productos = await this.productRepo.findOne({ where: { id }, relations: ['images', 'videos'] });

      if (!productos) {
        throw new NotFoundException(`Producto no encontrado`);
      }

      for (const archivo of [...productos.videos, ...productos.images]) {
        const publicId = extractPublicId(archivo.url);
        const isVideo = archivo.url.match(/\.(mp4|mov|avi|mkv|webm)$/i);
        const resourceType = isVideo ? 'video' : 'image';
        if (publicId) {
          try {
            await this.cloudinaryService.deleteFile(publicId, resourceType);
          } catch (error) {
            console.error(`Error al eliminar el archivo`, error);
          }
        }
      }

      await this.productRepo.delete(id);
      return { deleted: true };
    } catch (error) {
      throw new BadRequestException(error?.message || error);
    }
  }

  async updateApproval(id: number, body: { estado: string | null, rejectionReason?: string }) {

    const estadoValido = ['pendiente', 'aprobado', 'rechazado'];
    let estado: 'pendiente' | 'aprobado' | 'rechazado' = 'pendiente';

    if (body.estado && estadoValido.includes(body.estado)) {
      estado = body.estado as 'pendiente' | 'aprobado' | 'rechazado';
    }

    const product = await this.productRepo.findOne({ where: { id }, relations: ['user', 'images', 'videos'] });
    if (!product) throw new NotFoundException('Producto no encontrado');

    if (estado === 'rechazado') {

      if (product.images && product.images.length > 0) {
        for (const img of product.images) {
          const publicId = extractPublicId(img.url);
          if (publicId) {
            try {
              await this.cloudinaryService.deleteFile(publicId, 'image');
            } catch (error) {
              console.error(`Error al eliminar la imagen`, error);
            }
          }
          await this.imageRepo.delete({ id: img.id });
        }
      }
      if (product.videos && product.videos.length > 0) {
        for (const vid of product.videos) {
          const publicId = extractPublicId(vid.url);
          if (publicId) {
            try {
              await this.cloudinaryService.deleteFile(publicId, 'video');
            } catch (error) {
              console.error(`Error al eliminar el video`, error);
            }
          }
          await this.videoRepo.delete({ id: vid.id });
        }
      }

      if (body.rejectionReason && product.user?.email) {
        const subject = '¡Producto rechazado!';
        const message = `❌ ${product.name}, fue rechazado. Motivo: ${body.rejectionReason}`;
        await this.emailService.sendEmail(product.user.username, product.user.email, subject, message, '/');
      }
      await this.productRepo.delete(id);
      return { message: 'Producto y archivos eliminados correctamente' };
    }

    if (estado === 'aprobado') {
      if (product.user?.email) {
        await this.emailService.sendEmail(product.user.username, product.user.email, '¡Producto aprobado!', `🎉 ¡Tu producto "${product.name}" ha sido aprobado exitosamente!`, '/');
      }
    }

    await this.productRepo.update(id, { status_approval: estado });
    return this.productRepo.findOne({ where: { id }, relations: ['user', 'images', 'videos'] });
  }

}
