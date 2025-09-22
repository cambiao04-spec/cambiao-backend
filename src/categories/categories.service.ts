import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-categories.dto';
import { UpdateCategoryDto } from './dto/update-categories.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categories } from './entities/categories.entity';
import { Products } from '../products/entities/products.entity';

@Injectable()
export class CategoriesService {

  constructor(
    @InjectRepository(Categories)
    private categoryRepo: Repository<Categories>,
    @InjectRepository(Products)
    private productRepo: Repository<Products>
  ) { }

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepo.create(createCategoryDto);
    return await this.categoryRepo.save(category);
  }

  async findAll() {
    return this.categoryRepo.find();
  }

  async findOne(id: number) {
    return this.categoryRepo.findOne({ where: { id } });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    await this.categoryRepo.update(id, updateCategoryDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const productosAsociados = await this.productRepo.count({ where: { category: { id } } });
    if (productosAsociados > 0) {
      throw new BadRequestException('No se puede eliminar la categoría porque está asociada a uno o más productos.');
    }
    await this.categoryRepo.delete(id);
    return { deleted: true };
  }

}
