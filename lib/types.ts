export type PaymentStatus = "pending" | "success" | "failed" | "expired" | "refunded";

export type OrderStatus =
  | "created"
  | "waiting_payment"
  | "paid_generating"
  | "paid_delivered"
  | "paid_pending_voucher"
  | "payment_expired"
  | "payment_failed"
  | "cancelled";

export interface VoucherPackage {
  id: string;
  profile: string;
  name: string;
  price: number;
  description?: string;
  enabled: boolean;
}

export interface VoucherOrder {
  id: string;
  paymentOrderId: string;
  gatewayTransactionId?: string;
  providerTransactionId?: string;
  customerName?: string;
  customerPhone?: string;
  packageId: string;
  profile: string;
  packageName: string;
  amount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentUrl?: string;
  qrString?: string;
  voucherCode?: string;
  errorMessage?: string;
  paidAt?: string;
  deliveredAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  notifiedEvents?: string[];
}
