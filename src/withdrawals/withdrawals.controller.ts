import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { WithdrawalsService } from './withdrawals.service';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { WithdrawalsStatus } from './entities/withdrawals.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('withdrawals')
@Controller('withdrawals')
export class WithdrawalsController {

  constructor(private readonly withdrawalsService: WithdrawalsService) { }

  @Post('retiro')
  @UseGuards(AuthGuard)
  async crearRetiro(@Request() req, @Body() body) {
    const saldoId = body.saldoId;
    return await this.withdrawalsService.createRetiro(req.user.userId, saldoId);
  }

  @Get('retiro')
  @UseGuards(AuthGuard)
  async findAllRetiro() {
    return this.withdrawalsService.findAllRetiro();
  }

  @Get('retiro/user')
  @UseGuards(AuthGuard)
  async findAllRetiroUser(@Request() req) {
    return this.withdrawalsService.findAllRetiroUser(req.user.userId);
  }

  @Patch('retiro/:id')
  @UseGuards(AuthGuard)
  async updateRetiroEstado(@Param('id') id: number, @Body() body: { estado: WithdrawalsStatus | string }) {
    return this.withdrawalsService.updateEstadoRetiro(id, body.estado as WithdrawalsStatus);
  }

}
