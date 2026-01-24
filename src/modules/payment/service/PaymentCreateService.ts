import { Injectable } from "@nestjs/common";
import * as z from 'zod'

interface IRequest {
    reservationId: number;
    amount: number;
    method: string;
    currency?: string;
    customerEmail?: string;
}

@Injectable()
export class PaymentCreateService {
    
    async execute(data: IRequest) {
        const schemaValidation = z.object({
            reservationId: z.number(),
            amount: z.number().nullable(),
            method: z.string().nullable(),
            currency: z.string().optional(),
            customerEmail: z.string().optional()
        })

        const dataValid = schemaValidation.parse(data)

        console.log(dataValid)
    }
}