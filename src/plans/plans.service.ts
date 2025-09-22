
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plans } from './entities/plans.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plans)
    private readonly plansRepository: Repository<Plans>,
  ) { }

  async findOne(user_id: number): Promise<Plans | null> {
    const now = new Date();
    const plan = await this.plansRepository.createQueryBuilder('plan')
      .where('plan.users_id = :users_id', { users_id: user_id })
      .getOne();
    if (!plan) return null;
    const { users_id, ...rest } = plan;
    return rest as Plans;
  }
}
