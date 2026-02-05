import { Method } from "../domain/enums/Method";
import { UserDTO } from "./UserDTO";

export interface PaymentCaptureDTO {
    id: number;
    user: UserDTO;
    userId: number;
    amount: number;
    method?: Method
}