import type { Payment } from "@/types";

export interface CreateOrderParams {
  bookingId: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: "INR";
}

export interface PaymentOrderResult {
  orderId: string;
  gatewayProvider: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature?: string;
}

export interface IPaymentGateway {
  createOrder(params: CreateOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<{ success: boolean; transactionId: string }>;
  refundPayment(paymentId: string, amount: number): Promise<{ success: boolean }>;
}

export class MockPaymentGateway implements IPaymentGateway {
  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    return {
      orderId: `mock_order_${Date.now()}`,
      gatewayProvider: "mock",
      amount: params.amount,
      currency: params.currency,
    };
  }

  async verifyPayment(params: VerifyPaymentParams) {
    return {
      success: true,
      transactionId: params.paymentId || `mock_txn_${Date.now()}`,
    };
  }

  async refundPayment(paymentId: string) {
    console.log(`Mock refunded payment ${paymentId}`);
    return { success: true };
  }
}

export class RazorpayPaymentGateway implements IPaymentGateway {
  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    // Razorpay API SDK initialization placeholder
    return {
      orderId: `rzp_order_${Date.now()}`,
      gatewayProvider: "razorpay",
      amount: params.amount,
      currency: params.currency,
    };
  }

  async verifyPayment(params: VerifyPaymentParams) {
    // Razorpay HMAC signature verification placeholder
    return {
      success: true,
      transactionId: params.paymentId,
    };
  }

  async refundPayment(paymentId: string) {
    console.log(`Razorpay refunded payment ${paymentId}`);
    return { success: true };
  }
}

export interface IPaymentService {
  initiatePayment(params: CreateOrderParams): Promise<PaymentOrderResult>;
  confirmPayment(params: VerifyPaymentParams): Promise<Payment>;
}

export class PaymentService implements IPaymentService {
  constructor(private gateway: IPaymentGateway = new MockPaymentGateway()) {}

  async initiatePayment(params: CreateOrderParams): Promise<PaymentOrderResult> {
    return this.gateway.createOrder(params);
  }

  async confirmPayment(params: VerifyPaymentParams): Promise<Payment> {
    const result = await this.gateway.verifyPayment(params);
    return {
      id: `pay-${Date.now()}`,
      paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
      invoiceId: "inv-1",
      bookingId: "bk-1",
      customerId: "cust-1",
      amount: 350,
      gatewayProvider: "razorpay",
      gatewayOrderId: params.orderId,
      gatewayPaymentId: result.transactionId,
      status: "PAID",
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
}

export const paymentService = new PaymentService();
