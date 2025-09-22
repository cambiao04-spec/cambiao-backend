import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFiles, Request } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get('aprobados')
  findAllApproved() {
    return this.productsService.findAllApproved();
  }

  @Get('pendientes')
  findAllPending() {
    return this.productsService.findAllPending();
  }

  @Get('oferta')
  findAllOffer() {
    return this.productsService.findAllOffer();
  }

  @Get('count')
  async countProducts() {
    const count = await this.productsService.countProducts();
    return { count };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  findOne(@Request() req) {
    return this.productsService.findByUser(req.user.userId);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files', 4))
  create(
    @Body() createProductDto: CreateProductDto, @Request() req,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.productsService.createWithUser(createProductDto, files, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files', 4))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.productsService.update(+id, updateProductDto, files);
  }

  @Patch(':id/approval')
  @UseGuards(AuthGuard)
  async updateApproval(@Param('id') id: number, @Body() body: { estado: string | null, rejectionReason?: string }) {
    return this.productsService.updateApproval(+id, body);
  }

  @Patch('/oferta/:id')
  @UseGuards(AuthGuard)
  updateOffer(@Param('id') id: string, @Request() req) {
    return this.productsService.toggleOffer(Number(id), req.user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
