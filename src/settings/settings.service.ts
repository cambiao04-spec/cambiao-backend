import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingRepo: Repository<Setting>,
  ) {}

  async get(): Promise<{ enabled: boolean }> {
    const setting = await this.settingRepo.findOne({ where: { id: 1 } });
    return { enabled: setting?.maintenance_mode ?? false };
  }

  async toggle(enable: boolean) {
    let setting = await this.settingRepo.findOne({ where: { id: 1 } });
    if (!setting) {
      setting = this.settingRepo.create({ maintenance_mode: enable });
    } else {
      setting.maintenance_mode = enable;
    }
    await this.settingRepo.save(setting);
    return { success: true };
  }
}
