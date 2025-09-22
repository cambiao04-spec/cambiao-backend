import { Controller, Get, Post, Body} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) { }

  @Post()
  create( @Body() createContactDto: CreateContactDto) {
    const { name, email, message } = createContactDto;
    return this.contactService.send({ name, email, message });
  }

  @Post('newsletter')
  newsletter(@Body() body: { email: string }) {
    return this.contactService.newsletter(body);
  }

}
