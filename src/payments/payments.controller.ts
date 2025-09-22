import { Body, Controller, Get, Param, Patch, Post, Query, Request, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { PayArbitrationsService } from "./payArbirations.service";
import { PayPlansService } from "./payPlans.service";
import { AuthGuard } from "src/users/guard/auth.guard";
import { URL_FRONTEND } from "src/url";
import { PayProductsService } from "./payProducts.service";


@ApiTags('payments')
@Controller('payments')
export class PaymentsController {

  constructor(
    private readonly paymentService: PaymentsService,
    private readonly payProductService: PayProductsService,
    private readonly payArbitrationsService: PayArbitrationsService,
    private readonly payPlansService: PayPlansService
  ) { }

  @Get('currency')
  async getCurrency() {
    return await this.paymentService.getCurrencyByUserIp();
  }

  @Get('price/plan')
  async getPricePlan() {
    return await this.paymentService.getPricePlan();
  }

  @Get('saldo')
  @UseGuards(AuthGuard)
  async getBalance(@Request() req) {
    return await this.paymentService.getBalanceByUserId(req.user.userId);
  }

  @Get('fondos')
  @UseGuards(AuthGuard)
  async getFunds(@Request() req) {
    return await this.paymentService.getFundsByUserId(req.user.userId);
  }

  @Get('ganancias')
  @UseGuards(AuthGuard)
  async findAll() {
    return this.paymentService.findAllGanancias();
  }

  @Patch('ganancias/:id')
  @UseGuards(AuthGuard)
  async updateGanancia(@Param('id') id: number, @Body() body: { monto: number }) {
    return this.paymentService.updateGanancia(id, body.monto);
  }

  @Post()
  @UseGuards(AuthGuard)
  async pay(@Request() req, @Body() body: { ruta?: string }) {
    const tokenInfo = await this.payPlansService.createPayment(req.user.email, body.ruta);
    return { ...tokenInfo, ruta: body.ruta };
  }

  @Get('capture')
  async capturePayment(
    @Query('token') token: string,
    @Query('email') email: string,
    @Query('ruta') ruta: string,
    @Res() res
  ) {
    try {
      await this.payPlansService.capturePayment(token, { email });
      const redirectUrl = ruta ? `${URL_FRONTEND}/gracias?ruta=${encodeURIComponent(ruta)}` : `${URL_FRONTEND}/gracias`;
      return res.redirect(redirectUrl);
    } catch (error) {
      const msg = error?.message || 'Error capturando pago';
      const cancelUrl = ruta ? ruta : `${URL_FRONTEND}/gracias`;
      return res.status(500).send(`<script>alert('${msg.replace(/'/g, "\'")}');window.location='${cancelUrl}';</script>`);
    }
  }

  @Post(':id')
  @UseGuards(AuthGuard)
  async payWithId(@Param('id') id: number) {
    return this.payProductService.createPaymentWithProduct(id);
  }

  @Get('capture-product')
  async captureProductPayment(
    @Query('token') token: string,
    @Query('chatId') chatId: number,
    @Res() res
  ) {
    try {
      await this.payProductService.captureProductPayment(token, chatId);
      return res.redirect(`${URL_FRONTEND}/chats/me/${chatId}`);
    } catch (error) {
      const msg = error?.message || 'Error capturando pago de producto';
      return res.status(500).send(`<script>alert('${msg.replace(/'/g, "\\'")}');window.location='${URL_FRONTEND}/chats/me/${chatId}';</script>`);
    }
  }

  @Post('/arbitraje/:id')
  @UseGuards(AuthGuard)
  async payWithIdArbitraje(@Param('id') id: number, @Request() req, @Body() body: { ruta?: string }) {
    const tokenInfo = await this.payArbitrationsService.createPaymentArbitraje(id, req.user.email, body.ruta);
    return { ...tokenInfo, ruta: body.ruta };
  }

  @Get('capture-arbitraje')
  async capturePaymentArbitraje(
    @Query('token') token: string,
    @Query('email') email: string,
    @Query('ruta') ruta: string,
    @Query('chatId') chatId: number,
    @Res() res
  ) {
    try {
      await this.payArbitrationsService.capturePaymentArbitraje(token, { email, chatId });
      const redirectUrl = ruta ? `${URL_FRONTEND}/gracias?ruta=${encodeURIComponent(ruta)}` : `${URL_FRONTEND}/gracias`;
      return res.redirect(redirectUrl);
    } catch (error) {
      const msg = error?.message || 'Error capturando pago';
      const cancelUrl = ruta ? ruta : `${URL_FRONTEND}/gracias`;
      return res.status(500).send(`<script>alert('${msg.replace(/'/g, "\'")}');window.location='${cancelUrl}';</script>`);
    }
  }

}
