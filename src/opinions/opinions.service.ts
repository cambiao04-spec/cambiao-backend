import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOpinionDto } from './dto/create-opinion.dto';
import { UpdateOpinionDto } from './dto/update-opinion.dto';
import { Opinions } from './entities/opinions.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class OpinionsService {
  
  constructor(
    @InjectRepository(Opinions)
    private opinionsRepo: Repository<Opinions>,
    private readonly userService: UsersService
  ) { }

  async findAll() {
    const opinions = await this.opinionsRepo.find({
      relations: ['user', 'user.images'],
      order: { created_at: 'DESC' },
    });

    return opinions.map((opinion) => ({
      id: opinion.id,
      description: opinion.description,
      created_at: opinion.created_at,
      user: {
        nombre: opinion.user.username,
        fotoPerfil: opinion.user.images && opinion.user.images.length > 0 ? opinion.user.images[0].url : null,
      },
    }));
  }

  async findOne(id: number) {
    const opinion = await this.opinionsRepo.findOne({ where: { id }, relations: ['user'] });
    if (!opinion) throw new NotFoundException('Opinión no encontrada');
    return opinion;
  }

  async create(createOpinionDto: CreateOpinionDto, email: string): Promise<Opinions> {

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const opinion = this.opinionsRepo.create({
      description: createOpinionDto.descripcion,
      user: user,
    });
    return this.opinionsRepo.save(opinion);
  }

  async update(id: number, updateOpinionDto: UpdateOpinionDto) {
    const opinion = await this.findOne(id);
    Object.assign(opinion, updateOpinionDto);
    return this.opinionsRepo.save(opinion);
  }

  async remove(id: number) {
    const opinion = await this.findOne(id);
    return this.opinionsRepo.remove(opinion);
  }

}
