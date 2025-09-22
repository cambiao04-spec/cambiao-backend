import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chats } from 'src/chats/entities/chats.entity';
import { Ratings } from './entities/ratings.entity';
import { CreateRatingDto } from './dto/create-ratings.dto';

@Injectable()
export class RatingsService {

  constructor(
    @InjectRepository(Chats)
    private readonly chatRepository: Repository<Chats>,
    @InjectRepository(Ratings)
    private readonly ratingRepository: Repository<Ratings>,
  ) { }

  async RatingsUser(userId: number) {
    const chats = await this.chatRepository.find({
      where: [
        { userOne: { id: userId }, process_performed: true },
        { userTwo: { id: userId }, process_performed: true }
      ],
      relations: ['userOne', 'userTwo']
    });

    const result: Array<{
      chatId: number;
      userOne: { email: string; username: string };
      userTwo: { email: string; username: string };
    }> = [];

    for (const chat of chats) {

      const rating = await this.ratingRepository.findOne({
        where: {
          chat: { id: chat.id },
          userOne: { id: userId }
        }
      });
      if (!rating) {
        result.push({
          chatId: chat.id,
          userOne: {
            email: chat.userOne.email,
            username: chat.userOne.username
          },
          userTwo: {
            email: chat.userTwo.email,
            username: chat.userTwo.username
          },
        });
      }
    }
    return result;
  }

  async createRating(dto: CreateRatingDto) {
    
    const chat = await this.chatRepository.findOne({
      where: { id: dto.chatId },
      relations: ['userOne', 'userTwo']
    });
    if (!chat) {
      throw new Error('Chat no encontrado');
    }

    const userOne = chat.userOne.email === dto.evaluadorEmail ? chat.userOne : chat.userTwo;
    const userTwo = chat.userOne.email === dto.evaluadoEmail ? chat.userOne : chat.userTwo;
    if (!userOne || !userTwo) {
      throw new Error('Usuarios no encontrados en el chat');
    }

    const rating = this.ratingRepository.create({
      chat,
      userOne,
      userTwo,
      rating: dto.stars,
      comment: dto.comment
    });
    await this.ratingRepository.save(rating);
    return { success: true, rating };
  }
}
