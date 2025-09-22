import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Favorites } from './entities/favorites.entity';

@Injectable()
export class FavoritesService {

  constructor(
    @InjectRepository(Favorites)
    private readonly favoritesRepository: Repository<Favorites>,
  ) { }

  async findAll(userId: number) {
    const result = await this.favoritesRepository
      .createQueryBuilder('favorites')
      .select('favorites.products_id', 'productId')
      .where('favorites.users_id = :userId', { userId })
      .orderBy('favorites.created_at', 'DESC')
      .getRawMany();
    return result.map(r => r.productId);
  }

  async findAllMe(userId: number) {

    const favoritos = await this.favoritesRepository.find({
      where: {
        user: { id: userId },
        product: { status_approval: 'aprobado' }
      },
      relations: [
        'product',
        'product.images',
        'product.videos',
        'product.category',
        'product.user',
        'product.favorites'
      ],
      order: { created_at: 'DESC' },
    });

    return favoritos.map(fav => {
      const prod = fav.product;
      if (prod && prod.user) {
        (prod as any).user = { username: prod.user.username };
      }
      return prod;
    });
  }

  async create(createFavoriteDto: CreateFavoriteDto) {
    const favorite = this.favoritesRepository.create({
      user: { id: createFavoriteDto.users_id },
      product: { id: createFavoriteDto.products_id },
    });
    return await this.favoritesRepository.save(favorite);
  }

  async remove(productId: number, userId: number) {
    return await this.favoritesRepository.delete({ product: { id: productId }, user: { id: userId } });
  }

}
