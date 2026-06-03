// -------------------------
// DTOs
// -------------------------
export class SendGiftDto {
  eventId: string;
  amount: number;
  denomination: number;
  displayName: string;
  tokens: number;
}

export class TopUpDto {
  tokens: number;
  paymentReference: string;
}
