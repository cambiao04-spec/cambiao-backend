import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-messages.dto';
import { UpdateMessageDto } from './dto/update-messages.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/users/guard/auth.guard';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {

  constructor(private readonly messagesService: MessagesService) { }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.messagesService.findAll();
  }

  @Get('chat/:chatId')
  @UseGuards(AuthGuard)
  findMessagesByChat(@Param('chatId') chatId: string) {
    return this.messagesService.findByChat(+chatId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(+id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagesService.create(createMessageDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(+id, updateMessageDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.messagesService.remove(+id);
  }

}
