import { Injectable } from "@nestjs/common";
import { CreatePaymentService } from "./CreatePaymentService";
import { AmountCaptureService } from "./AmountCaptureService";
import { RefundPaymentService } from "./RefundPaymentService";
import { FindPaymentByIdService } from "./FindPaymentByIdService";
import { FindPaymentByReservationService } from "./FindPaymentByReservationService";

@Injectable()
export class PaymentService {
    constructor(
        private readonly createService : CreatePaymentService,
        private readonly findPaymentByReservationService : FindPaymentByReservationService,
        private readonly findPaymentByIdService : FindPaymentByIdService,
        private readonly refundPaymentService : RefundPaymentService,
        private readonly capturePaymentService : AmountCaptureService
    ) {}

    async create(data: any) {
        return await this.createService.execute(data);
    }

    async findById(id: string) {
        return await this.findPaymentByIdService.execute(id);
    }

    async findByReservationId(reservationId: string) {
        return await this.findPaymentByReservationService.execute(reservationId);
    }

    async refund(id: string) {
        return await this.refundPaymentService.execute(id);
    }

    async capture(data: any) {
        return await this.capturePaymentService.execute(data);
    }
}