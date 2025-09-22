import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('chats')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  async getChatsByUser(@Request() req) {
    const email = req.user.email;
    return this.chatsService.findChatsByUser(email);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Request() req, @Body() body: { product_id: number; tipo_accion: string }) {
    const email = req.user.email;
    const { product_id, tipo_accion } = body;

    const chatExists = await this.chatsService.createChatFromProduct(email, product_id, tipo_accion);
    return chatExists;
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateCancelDate(
    @Param('id') id: number,
    @Body() body: { fecha_cancelacion: string; proceso_realizado?: boolean }
  ) {
    return this.chatsService.updateCancelDate(id, body.fecha_cancelacion, body.proceso_realizado);
  }

}
