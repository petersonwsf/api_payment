import { BadRequestException, Body, Controller, Get, HttpCode, Inject, NotFoundException, Param, Post } from '@nestjs/common';
import type { CreatePaymentIntent } from 'src/modules/payment/dtos/CreatePaymentIntent';
import * as zod from 'zod'
import { CreatePaymentService } from '../service/CreatePaymentService';
import { AmountZero } from '../domain/errors/AmountZero.error';
import { FindPaymentByReservationService } from '../service/FindPaymentByReservationService';
import { ReservationPaymentNotFound } from '../domain/errors/ReservationPaymentNotFound';
import { InvalidId } from '../domain/errors/InvalidId';
import { FindPaymentByIdService } from '../service/FindPaymentByIdService';
import { PaymentNotFound } from '../domain/errors/PaymentNotFound';

@Controller('payment')
export class PaymentController {
    constructor(private readonly createService: CreatePaymentService,
                private readonly findPaymentByReservationService : FindPaymentByReservationService,
                private readonly findPaymentByIdService : FindPaymentByIdService) {}

    @Post()
    @HttpCode(201)
    async createPaymentIntent(@Body() data: CreatePaymentIntent) {
        try {
            const payment = await this.createService.execute(data)
            return { payment }
        } catch (error) {
            if (error instanceof zod.ZodError) {
                throw new BadRequestException({message: "Dados inválidos"})
            } else if (error instanceof AmountZero) {
                throw new BadRequestException({message: error.message})
            }
        }
    }

    @Get(':id')
    @HttpCode(200)
    async findPaymentById(@Param() params : { id : string }) {
        try {
            const payment = await this.findPaymentByIdService.execute(params.id)
            return payment
        } catch (error) {
            if (error instanceof InvalidId) throw new BadRequestException(error.message)
            if (error instanceof PaymentNotFound) throw new NotFoundException(error.message)
        }
    }

    @Get('reservation/:reservationId')
    @HttpCode(200)
    async findPaymentByReservationId(@Param() params: { reservationId: string }) {
        try {
            const reservationId = params.reservationId
            const payments = await this.findPaymentByReservationService.execute(reservationId)
            return payments
        } catch (error) {
            if (error instanceof ReservationPaymentNotFound) throw new NotFoundException(error.message)
            if (error instanceof InvalidId) throw new BadRequestException(error.message)
        }
    }
}