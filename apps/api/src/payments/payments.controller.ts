import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReversePaymentDto } from './dto/reverse-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll() {
    const gymId = '00000000-0000-0000-0000-000000000001';

    return this.paymentsService.findAll(gymId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const gymId = '00000000-0000-0000-0000-000000000001';

    return this.paymentsService.findOne(gymId, id);
  }

  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    const gymId = '00000000-0000-0000-0000-000000000001';

    return this.paymentsService.create(gymId, dto);
  }

  @Post(':id/reverse')
  async reverse(@Param('id') id: string, @Body() dto: ReversePaymentDto) {
    const gymId = '00000000-0000-0000-0000-000000000001';

    return this.paymentsService.reverse(gymId, id, dto);
  }
}
