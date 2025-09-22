import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/users/guard/auth.guard';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @Get('maintenance')
  getMaintenance() {
    return this.settingsService.get();
  }

  @Post('maintenance')
  @UseGuards(AuthGuard)
  updateMaintenance(@Body('enabled') enabled: boolean) {
    return this.settingsService.toggle(enabled);
  }
}
