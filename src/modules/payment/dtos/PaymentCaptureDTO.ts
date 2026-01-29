import { Method } from "../domain/enums/Method";

export interface PaymentCaptureDTO {
    id: number;
    amount: number;
    method?: Method
}