import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinay.service';
import { EmailService } from 'src/users/email.service';
import { Identities } from './entities/identities.entity';
import { Users } from 'src/users/entities/users.entity';
import { UsersImages } from 'src/users/entities/usersImages.entity';
import { CreateIdentitiesDto } from './dto/create-identities.dto';
import { extractPublicId } from 'src/validationUtils';

@Injectable()
export class IdentitiesService {
	constructor(
		@InjectRepository(Identities)
		private readonly identitiesRepo: Repository<Identities>,
		@InjectRepository(Users)
		private readonly userRepo: Repository<Users>,
		@InjectRepository(UsersImages)
		private readonly userImageRepo: Repository<UsersImages>,
		private readonly cloudinaryService: CloudinaryService,
		private readonly emailService: EmailService,
	) { }

	async createIdentities(
		userId: number,
		dto: CreateIdentitiesDto,
		files: Record<string, Express.Multer.File[]>
	) {

		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new BadRequestException('Usuario no encontrado');

		const identities = this.identitiesRepo.create({
			names: dto.nombres,
			last_names: dto.apellidos,
			birth_date: new Date(dto.fechaNacimiento),
			gender: (['Masculino', 'Femenino', 'No identificado'].includes(dto.genero) ? dto.genero : 'No identificado') as 'Masculino' | 'Femenino' | 'No identificado',
			user: user,
		});
		await this.identitiesRepo.save(identities);

		const imageFields = ['fotoPerfil', 'cedulaFrontal', 'cedulaTrasera', 'selfie'];
		for (const field of imageFields) {
			const arr = files[field];
			if (arr && arr.length > 0) {
				const file = arr[0];
				const upload = await this.cloudinaryService.uploadFile(file);
				const userImage = this.userImageRepo.create({
					url: upload.secure_url,
					user: user,
					type: field as 'fotoPerfil' | 'cedulaFrontal' | 'cedulaTrasera' | 'selfie',
				});
				await this.userImageRepo.save(userImage);
			}
		}

		const adminUsers = await this.userRepo.find({ where: { role: 'admin' } });
		const adminEmails = adminUsers.map(u => u.email);
		const username = 'Administrador';
		const subject = 'Revisión de documentos requerida';
		const ruta = '/';
		const message = 'Estimado administrador,\n\nSe ha recibido un nuevo documento de usuario que requiere revisión y validación. Por favor, accede al panel de administración para verificar los datos y proceder con la aprobación o rechazo correspondiente.\n\nGracias.';

		await this.emailService.sendEmail(username, adminEmails, subject, message, ruta);

		return { message: 'Datos y fotos guardados correctamente' };
	}

	async findOne(userId: number) {

		const identities = await this.identitiesRepo.findOne({
			where: { user: { id: userId } },
			relations: ['user', 'user.images'],
		});

		if (identities) {
			let fotoPerfil: string | null = null;
			if (identities.user && Array.isArray(identities.user.images) && identities.user.images.length > 0) {
				fotoPerfil = identities.user.images[0].url;
			}

			const { email, username } = identities.user || {};
			return {
				...identities,
				user: { email, username },
				fotoPerfil,
			} as any;
		}

	}

	async findAll(): Promise<Identities[]> {
		return await this.identitiesRepo.find({ relations: ['user', 'user.images'] });
	}

	async findAllPending(): Promise<Identities[]> {
		return await this.identitiesRepo.find({ where: { status: 'pendiente' }, relations: ['user', 'user.images'] });
	}

	async update(id: number, body: { estado: string | null, rejectionReason?: string }) {

		if (body.estado === 'rechazado') {

			const identities = await this.identitiesRepo.findOne({ where: { id }, relations: ['user', 'user.images'] });

			if (!identities) throw new NotFoundException('Usuario no encontrado');

			if (identities && identities.user.images && identities.user.images.length > 0) {
				for (const file of identities.user.images) {
					try {
						const publicId = extractPublicId(file.url);
						if (publicId) {
							try {
								await this.cloudinaryService.deleteFile(publicId, 'image');
								await this.userImageRepo.delete({ id: file.id });
							} catch (error) {
								console.error(`Error al eliminar la imagen`, error);
							}
						}
					} catch (e) {
						console.error('Error eliminando archivo de Cloudinary:', e);
					}
				}
			} else {
				console.log('No se encontraron archivos asociados al workstar.');
			}

			if (body.rejectionReason && identities?.user?.email) {
				const subject = '¡Documentos rechazados!';
				const ruta = '/';
				const message = `❌ Motivo: ${body.rejectionReason}`;
				await this.emailService.sendEmail(identities.user.username, identities.user.email, subject, message, ruta);
			}
			await this.identitiesRepo.delete(id);
			return { message: 'Archivos eliminados correctamente' };
		}

		if (body.estado === 'aprobado') {

			const profile = await this.identitiesRepo.findOne({ where: { id }, relations: ['user'] });
			if (profile?.user?.email) {

				const subject = '¡Documentos aprobados!';
				const message = `🎉 ¡Tus documentos han sido aprobados exitosamente! Ahora puedes disfrutar de todas las funcionalidades de nuestra plataforma.`;
				const ruta = '/';
				await this.emailService.sendEmail(profile.user.username, profile.user.email, subject, message, ruta);
			}
		}

		const estadoValido = ['pendiente', 'aprobado', 'rechazado'];

		let estado: 'pendiente' | 'aprobado' | 'rechazado' = 'pendiente';

		if (body.estado && estadoValido.includes(body.estado)) {
			estado = body.estado as 'pendiente' | 'aprobado' | 'rechazado';
		}
		await this.identitiesRepo.update(id, { status: estado });
		return this.identitiesRepo.findOne({ where: { id }, relations: ['user', 'user.images'] });
	}
}
