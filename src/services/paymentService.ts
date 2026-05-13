// paymentService.ts

export type SupportedCurrency = "USD" | "NPR";
export type PaymentMethod = "esewa" | "khalti" | "ime-pay" | "connect-ips";

export interface ExchangeRates {
  USD: number;
  NPR: number;
  EUR?: number;
  GBP?: number;
  JPY?: number;
}

export interface PaymentRequest {
  amount: number;
  currency: SupportedCurrency;
  paymentMethod: PaymentMethod;
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  successUrl: string;
  failureUrl: string;
  bookingRates?: ExchangeRates; // fixed booking-time rates
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  message: string;
  redirectForm?: string;
  amount?: number;
  currency?: SupportedCurrency;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

// fallback if bookingRates is missing
const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  NPR: 148.5,
};

const sanitizeHtml = (value: string | number): string => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const convertAmount = (
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  rates: ExchangeRates = FALLBACK_RATES
): number => {
  if (from === to) return amount;

  const usdAmount = from === "USD" ? amount : amount / (rates[from] || 1);
  const converted = to === "USD" ? usdAmount : usdAmount * (rates[to] || 1);

  return Math.round(converted * 100) / 100;
};

export const formatMoney = (
  amount: number,
  currency: SupportedCurrency
): string => {
  const locale = currency === "NPR" ? "ne-NP" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "NPR" ? 2 : 2,
  }).format(amount);
};

abstract class BasePaymentService {
  static async verifyPayment(
    orderId: string,
    amount: number,
    refId: string,
    merchantCode?: string
  ): Promise<VerificationResponse> {
    try {
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          amount,
          refId,
          merchantCode,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Verification failed with status ${response.status}`,
        };
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        message:
          "Payment verification failed: " + (error as Error).message,
      };
    }
  }
}

// ================= eSewa =================
export class ESewaPaymentService extends BasePaymentService {
  private static readonly ESEWA_URL = "https://rc-epay.esewa.com.np/auth";
  private static readonly VERIFY_URL = "https://rc-epay.esewa.com.np/auth";
  private static readonly MERCHANT_CODE = "EPAYTEST";

  static async initiatePayment(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const rates = request.bookingRates || FALLBACK_RATES;

      const amountInNPR =
        request.currency === "USD"
          ? convertAmount(request.amount, "USD", "NPR", rates)
          : request.amount;

      const roundedAmount = Math.round(amountInNPR * 100) / 100;

      const params = {
        amt: roundedAmount,
        psc: 0,
        pdc: 0,
        txAmt: 0,
        tAmt: roundedAmount,
        pid: request.orderId,
        scd: this.MERCHANT_CODE,
        su: request.successUrl,
        fu: request.failureUrl,
      };

      const formInputs = Object.entries(params)
        .map(
          ([key, value]) =>
            `<input type="hidden" name="${sanitizeHtml(key)}" value="${sanitizeHtml(value)}" />`
        )
        .join("");

      const form = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirecting to eSewa</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: #fff;
    }
    .box {
      width: min(92vw, 460px);
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 18px;
      padding: 28px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.35);
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid rgba(255,255,255,0.2);
      border-top: 4px solid #38bdf8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 18px;
    }
    h2 {
      margin: 0 0 10px;
      font-size: 22px;
    }
    p {
      margin: 8px 0;
      color: #e2e8f0;
    }
    .meta {
      margin-top: 16px;
      padding: 14px;
      border-radius: 12px;
      background: rgba(255,255,255,0.06);
      text-align: left;
    }
    .meta strong {
      color: white;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body onload="setTimeout(() => document.getElementById('esewa-form')?.submit(), 900)">
  <div class="box">
    <div class="spinner"></div>
    <h2>Redirecting to eSewa</h2>
    <p>Please wait while we securely connect your payment.</p>

    <div class="meta">
      <p><strong>Amount:</strong> NPR ${sanitizeHtml(roundedAmount.toLocaleString())}</p>
      <p><strong>Order ID:</strong> ${sanitizeHtml(request.orderId)}</p>
      <p><strong>Customer:</strong> ${sanitizeHtml(request.customerInfo.name)}</p>
    </div>

    <form id="esewa-form" action="${sanitizeHtml(this.ESEWA_URL)}" method="POST" style="display:none;">
      ${formInputs}
    </form>
  </div>
</body>
</html>`;

      return {
        success: true,
        redirectForm: form,
        transactionId: request.orderId,
        message: "Redirecting to eSewa payment gateway",
        amount: roundedAmount,
        currency: "NPR",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to initiate eSewa payment: " + (error as Error).message,
      };
    }
  }

  static async verifyPayment(
    orderId: string,
    amount: number,
    refId: string
  ): Promise<VerificationResponse> {
    return super.verifyPayment(orderId, amount, refId, this.MERCHANT_CODE);
  }
}

// ================= Khalti =================
export class KhaltiPaymentService extends BasePaymentService {
  static async initiatePayment(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      return {
        success: true,
        paymentUrl: `https://khalti.com/payment?amount=${encodeURIComponent(
          String(request.amount)
        )}&order_id=${encodeURIComponent(request.orderId)}`,
        transactionId: request.orderId,
        message: "Redirecting to Khalti payment gateway",
        amount: request.amount,
        currency: request.currency,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to initiate Khalti payment: " + (error as Error).message,
      };
    }
  }
}

// ================= IME Pay =================
export class IMEPayService extends BasePaymentService {
  static async initiatePayment(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      return {
        success: true,
        paymentUrl: `https://imepay.com.np/payment?amount=${encodeURIComponent(
          String(request.amount)
        )}&order_id=${encodeURIComponent(request.orderId)}`,
        transactionId: request.orderId,
        message: "Redirecting to IME Pay gateway",
        amount: request.amount,
        currency: request.currency,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to initiate IME Pay payment: " + (error as Error).message,
      };
    }
  }
}

// ================= ConnectIPS =================
export class ConnectIPSService extends BasePaymentService {
  static async initiatePayment(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      return {
        success: true,
        paymentUrl: `https://connectips.com/payment?amount=${encodeURIComponent(
          String(request.amount)
        )}&order_id=${encodeURIComponent(request.orderId)}`,
        transactionId: request.orderId,
        message: "Redirecting to ConnectIPS gateway",
        amount: request.amount,
        currency: request.currency,
      };
    } catch (error) {
      return {
        success: false,
        message:
          "Failed to initiate ConnectIPS payment: " + (error as Error).message,
      };
    }
  }
}

// ================= Factory =================
export class PaymentServiceFactory {
  static getService(paymentMethod: PaymentMethod) {
    switch (paymentMethod) {
      case "esewa":
        return ESewaPaymentService;
      case "khalti":
        return KhaltiPaymentService;
      case "ime-pay":
        return IMEPayService;
      case "connect-ips":
        return ConnectIPSService;
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
  }
}