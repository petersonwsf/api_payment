import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, NotFoundException, Param, Post } from '@nestjs/common';
import type { CreatePaymentIntent } from 'src/modules/payment/dtos/CreatePaymentIntent';
import * as zod from 'zod'
import { CreatePaymentService } from '../service/CreatePaymentService';
import { AmountZero } from '../domain/errors/AmountZero.error';
import { FindPaymentByReservationService } from '../service/FindPaymentByReservationService';
import { ReservationPaymentNotFound } from '../domain/errors/ReservationPaymentNotFound';
import { InvalidId } from '../domain/errors/InvalidId';
import { FindPaymentByIdService } from '../service/FindPaymentByIdService';
import { PaymentNotFound } from '../domain/errors/PaymentNotFound';
import { RefundPaymentService } from '../service/RefundPaymentService';
import { PaymentCannotBeRefunded } from '../domain/errors/PaymentCannotBeRefunded';
import { AmountCaptureService } from '../service/AmountCaptureService';
import type { PaymentCaptureDTO } from '../dtos/PaymentCaptureDTO';
import { PaymentAutomaticCapture } from '../domain/errors/PaymentAutomaticCapture';
import { PaymentCannotBeCaptured } from '../domain/errors/PaymentCannotBeCaptured';
import { ValueAbovePermitted } from '../domain/errors/ValueAbovePermitted';
import { StripeError } from '../domain/errors/StripeError';

@Controller('payment')
export class PaymentController {
    constructor(private readonly createService: CreatePaymentService,
                private readonly findPaymentByReservationService : FindPaymentByReservationService,
                private readonly findPaymentByIdService : FindPaymentByIdService,
                private readonly refundPaymentService : RefundPaymentService,
                private readonly capturePaymentService : AmountCaptureService) {}

    @Post()
    @HttpCode(201)
    async createPaymentIntent(@Body() data: CreatePaymentIntent) {
        try {
            const payment = await this.createService.execute(data)
            return { payment }
        } catch (error) {
            if (error instanceof zod.ZodError) throw new BadRequestException({message: "Dados inválidos"})
            if (error instanceof AmountZero) throw new BadRequestException({message: error.message})
            throw Error("Unhandled error!")
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
            throw Error("Unhandled error!")
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
            throw Error("Unhandled error!")
        }
    }

    @Delete(':id')
    @HttpCode(200)
    async refundPayment(@Param() params : { id : string }) {
        try {
            const refund = await this.refundPaymentService.execute(params.id)
            return refund
        } catch (error) {
            if (error instanceof InvalidId) throw new BadRequestException(error.message)
            if (error instanceof PaymentNotFound) throw new NotFoundException(error.message)
            if (error instanceof PaymentCannotBeRefunded) throw new ForbiddenException(error.message)
            throw Error("Unhandled error!")
        }
    }

    @Post('/capture')
    @HttpCode(200)
    async capturePayment(@Body() data : PaymentCaptureDTO) {
        try {
            const caputure = await this.capturePaymentService.execute(data)
            return { caputure }
        } catch (error) {
            if (error instanceof zod.ZodError) throw new BadRequestException("Invalid data!")
            if (error instanceof AmountZero) throw new BadRequestException(error.message)
            if (error instanceof ValueAbovePermitted) throw new BadRequestException(error.message)
            if (error instanceof BadRequestException) throw new BadRequestException(error.message)
            if (error instanceof PaymentNotFound) throw new NotFoundException(error.message)
            if (error instanceof PaymentAutomaticCapture) throw new ForbiddenException(error.message)
            if (error instanceof PaymentCannotBeCaptured) throw new ForbiddenException(error.message)
            if (error instanceof StripeError) throw new Error(error.message)
            throw Error("Unhandled error!")
        }
    }

}